import { db } from "./db";
import { computeTier, tierRate, DEFAULT_TIER_RATES } from "./tier";
import type { CreditLedgerKind, ClubItTier } from "@/lib/enums";
import { parseJson } from "@/lib/enums";

interface AccrueParams {
  cardId: string;
  venueId: string;
  amountAgorot: number; // purchase amount
  reservationId?: string;
  note?: string;
}

/**
 * Accrue credits for a purchase. Persists ledger entry and updates per-venue balance + total spend
 * and (if needed) the user's tier.
 */
export async function accrueCreditsForPurchase({
  cardId,
  venueId,
  amountAgorot,
  reservationId,
  note,
}: AccrueParams) {
  const card = await db.clubItCard.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Card not found");

  const settings = await db.venueSettings.findUnique({ where: { venueId } });
  const rates = parseJson<Partial<Record<ClubItTier, number>>>(
    settings?.creditRatePerTier,
    DEFAULT_TIER_RATES
  );
  const rate = tierRate(card.tier as ClubItTier, rates);
  const credits = Math.round(amountAgorot * rate);

  const thresholds = settings
    ? {
        SILVER: settings.silverThresholdAgorot,
        GOLD: settings.goldThresholdAgorot,
        PLATINUM: settings.platinumThresholdAgorot,
      }
    : undefined;

  const newTotalSpent = card.totalSpentAgorot + amountAgorot;
  const newTier = computeTier(newTotalSpent, thresholds);

  await db.$transaction(async (tx) => {
    await tx.creditLedger.create({
      data: {
        cardId,
        venueId,
        kind: "EARN_PURCHASE",
        amount: credits,
        ref: reservationId,
        note,
      },
    });

    await tx.userBalance.upsert({
      where: { cardId_venueId: { cardId, venueId } },
      create: {
        cardId,
        venueId,
        creditsBalance: credits,
        creditsAccrued: credits,
      },
      update: {
        creditsBalance: { increment: credits },
        creditsAccrued: { increment: credits },
      },
    });

    if (newTier !== card.tier) {
      await tx.clubItCard.update({
        where: { id: cardId },
        data: { totalSpentAgorot: newTotalSpent, tier: newTier },
      });
      await tx.tierEvent.create({
        data: { cardId, fromTier: card.tier, toTier: newTier },
      });
    } else {
      await tx.clubItCard.update({
        where: { id: cardId },
        data: { totalSpentAgorot: newTotalSpent },
      });
    }
  });

  return { creditsEarned: credits, tier: newTier, tierChanged: newTier !== card.tier };
}

interface BumpParams {
  cardId: string;
  venueId: string;
  buddyCount: number;
}

const BUMP_CREDITS_PER_BUDDY = 500;   // 5₪ worth per buddy (5 credits = ₪5? — PDF says 5 credits)
const BUMP_DAILY_CAP = 5000;          // 50 credits/night cap per PDF (in agorot)

export async function accrueBumpCredits({
  cardId,
  venueId,
  buddyCount,
}: BumpParams) {
  if (buddyCount <= 0) return { creditsEarned: 0 };

  // PDF spec: 5 credits per identified buddy, cap 50 credits per check-in
  const credits = Math.min(buddyCount * 5, 50);

  await db.$transaction(async (tx) => {
    await tx.creditLedger.create({
      data: {
        cardId,
        venueId,
        kind: "EARN_BUMP",
        amount: credits,
        note: `Bump check-in · ${buddyCount} buddies`,
      },
    });
    await tx.userBalance.upsert({
      where: { cardId_venueId: { cardId, venueId } },
      create: {
        cardId,
        venueId,
        creditsBalance: credits,
        creditsAccrued: credits,
      },
      update: {
        creditsBalance: { increment: credits },
        creditsAccrued: { increment: credits },
      },
    });
  });

  return { creditsEarned: credits };
}

/**
 * Manual credit adjustment from the CRM (grant or deduct).
 * Positive amount grants credits, negative deducts (never below zero).
 * Recorded as an ADJUST ledger entry for audit.
 */
export async function adjustCredits({
  cardId,
  venueId,
  amount,
  note,
  by,
}: {
  cardId: string;
  venueId: string;
  amount: number;
  note?: string;
  by?: string;
}) {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error("Invalid amount");
  }

  const balance = await db.userBalance.findUnique({
    where: { cardId_venueId: { cardId, venueId } },
  });
  const current = balance?.creditsBalance ?? 0;

  // Clamp deductions so the balance never goes negative.
  const applied = amount < 0 ? -Math.min(current, -amount) : amount;
  if (applied === 0) return { applied: 0, balance: current };

  const auditNote = [note, by ? `(${by})` : null].filter(Boolean).join(" ") || undefined;

  await db.$transaction([
    db.creditLedger.create({
      data: { cardId, venueId, kind: "ADJUST", amount: applied, note: auditNote },
    }),
    db.userBalance.upsert({
      where: { cardId_venueId: { cardId, venueId } },
      create: {
        cardId,
        venueId,
        creditsBalance: Math.max(0, applied),
        creditsAccrued: applied > 0 ? applied : 0,
        creditsRedeemed: applied < 0 ? -applied : 0,
      },
      update: {
        creditsBalance: { increment: applied },
        ...(applied > 0
          ? { creditsAccrued: { increment: applied } }
          : { creditsRedeemed: { increment: -applied } }),
      },
    }),
  ]);

  return { applied, balance: current + applied };
}

export async function getCardBalances(cardId: string) {
  const balances = await db.userBalance.findMany({
    where: { cardId },
    include: { venue: true },
    orderBy: { creditsBalance: "desc" },
  });
  const total = balances.reduce((sum, b) => sum + b.creditsBalance, 0);
  return { balances, total };
}

export async function redeemCredits({
  cardId,
  venueId,
  amount,
  kind = "REDEEM_BAR",
  ref,
  note,
}: {
  cardId: string;
  venueId: string;
  amount: number;
  kind?: CreditLedgerKind;
  ref?: string;
  note?: string;
}) {
  const balance = await db.userBalance.findUnique({
    where: { cardId_venueId: { cardId, venueId } },
  });
  if (!balance || balance.creditsBalance < amount) {
    throw new Error("Insufficient credits");
  }

  await db.$transaction([
    db.creditLedger.create({
      data: { cardId, venueId, kind, amount: -amount, ref, note },
    }),
    db.userBalance.update({
      where: { cardId_venueId: { cardId, venueId } },
      data: {
        creditsBalance: { decrement: amount },
        creditsRedeemed: { increment: amount },
      },
    }),
  ]);

  return { redeemed: amount };
}
