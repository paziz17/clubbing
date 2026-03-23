import { prisma } from "./prisma";
import { LedgerType } from "@prisma/client";

export async function calculateBalance(userId: string, clubId: string): Promise<number> {
  const entries = await prisma.creditLedger.findMany({
    where: { userId, clubId },
    orderBy: { createdAt: "asc" },
  });

  let balance = 0;
  const now = new Date();

  for (const entry of entries) {
    if (entry.type === "EARN" || entry.type === "ADJUST") {
      if (entry.expirationDate && entry.expirationDate < now) continue;
      balance += entry.amount;
    } else if (entry.type === "REDEEM" || entry.type === "EXPIRE") {
      balance += entry.amount; // amount is negative
    }
  }

  return balance;
}

export async function earnCredits(
  userId: string,
  clubId: string,
  amount: number,
  expirationDays: number,
  meta?: { transactionId?: string }
) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);

  const balance = await calculateBalance(userId, clubId);
  const newBalance = balance + amount;

  await prisma.creditLedger.create({
    data: {
      userId,
      clubId,
      type: LedgerType.EARN,
      amount,
      balanceAfter: newBalance,
      expirationDate,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });

  return newBalance;
}

export async function redeemCredits(
  userId: string,
  clubId: string,
  amount: number,
  meta?: { voucherId?: string }
) {
  const balance = await calculateBalance(userId, clubId);
  if (balance < amount) throw new Error("Insufficient credits");

  const newBalance = balance - amount;

  await prisma.creditLedger.create({
    data: {
      userId,
      clubId,
      type: LedgerType.REDEEM,
      amount: -amount,
      balanceAfter: newBalance,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });

  return newBalance;
}

export async function grantBonusCredits(
  userId: string,
  clubId: string,
  amount: number,
  expirationDays: number,
  meta?: { campaignId?: string }
) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);

  const balance = await calculateBalance(userId, clubId);
  const newBalance = balance + amount;

  await prisma.creditLedger.create({
    data: {
      userId,
      clubId,
      type: LedgerType.ADJUST,
      amount,
      balanceAfter: newBalance,
      expirationDate,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });

  return newBalance;
}

export function getExpiringCredits(userId: string, clubId: string, withinDays: number = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);

  return prisma.creditLedger.findMany({
    where: {
      userId,
      clubId,
      type: { in: ["EARN", "ADJUST"] },
      amount: { gt: 0 },
      expirationDate: { lte: cutoff, gte: new Date() },
    },
    orderBy: { expirationDate: "asc" },
  });
}
