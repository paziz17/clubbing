import { db } from "./db";

const DEFAULT_COMMISSION_PCT = 10;

/** Providers that represent real incoming money (excludes wallet redemptions). */
const REVENUE_PROVIDERS_EXCLUDED = new Set(["wallet"]);

async function commissionPct(venueId: string) {
  const settings = await db.venueSettings.findUnique({
    where: { venueId },
    select: { clubbingCommissionPct: true },
  });
  return settings?.clubbingCommissionPct ?? DEFAULT_COMMISSION_PCT;
}

/**
 * Live Net Payout Balance for a venue:
 *   Gross (unsettled PAID money in) − Clubbing commission = Net.
 * Wallet (credit) redemptions are excluded from gross (not new money).
 */
export async function computeVenueBalance(venueId: string) {
  const pct = await commissionPct(venueId);
  const txns = await db.transaction.findMany({
    where: { venueId, status: "PAID", settlementId: null },
    select: { amountAgorot: true, paymentProvider: true },
  });
  const gross = txns
    .filter((t) => !REVENUE_PROVIDERS_EXCLUDED.has(t.paymentProvider ?? ""))
    .reduce((s, t) => s + Math.max(0, t.amountAgorot), 0);
  const commission = Math.round((gross * pct) / 100);
  const net = gross - commission;
  return { gross, commission, net, commissionPct: pct, txnCount: txns.length };
}

/**
 * Settle a venue: snapshot the current balance into a Settlement record and
 * stamp all included transactions so the live balance resets to zero.
 * Performed by the platform admin after the manual bank transfer.
 */
export async function settleVenue(params: {
  venueId: string;
  settledBy?: string;
  bankRef?: string;
  note?: string;
}) {
  const pct = await commissionPct(params.venueId);

  return db.$transaction(async (tx) => {
    const txns = await tx.transaction.findMany({
      where: { venueId: params.venueId, status: "PAID", settlementId: null },
      select: { id: true, amountAgorot: true, paymentProvider: true },
    });
    const includedIds = txns.map((t) => t.id);
    const gross = txns
      .filter((t) => !REVENUE_PROVIDERS_EXCLUDED.has(t.paymentProvider ?? ""))
      .reduce((s, t) => s + Math.max(0, t.amountAgorot), 0);
    const commission = Math.round((gross * pct) / 100);
    const net = gross - commission;

    const settlement = await tx.settlement.create({
      data: {
        venueId: params.venueId,
        grossAgorot: gross,
        commissionAgorot: commission,
        netAgorot: net,
        commissionPct: pct,
        txnCount: includedIds.length,
        status: "SETTLED",
        bankRef: params.bankRef ?? null,
        note: params.note ?? null,
        settledBy: params.settledBy ?? null,
      },
    });

    if (includedIds.length > 0) {
      await tx.transaction.updateMany({
        where: { id: { in: includedIds } },
        data: { settlementId: settlement.id },
      });
    }
    return settlement;
  });
}

export async function listSettlements(venueId: string, take = 50) {
  return db.settlement.findMany({
    where: { venueId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
