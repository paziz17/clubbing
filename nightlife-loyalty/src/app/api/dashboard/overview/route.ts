import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get("club_id");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!clubId) {
    return NextResponse.json({ error: "club_id נדרש" }, { status: 400 });
  }

  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const [transactions, visits, creditStats] = await Promise.all([
    prisma.transaction.findMany({
      where: { clubId, createdAt: { gte: fromDate, lte: toDate } },
    }),
    prisma.visit.findMany({
      where: { clubId, checkInTime: { gte: fromDate, lte: toDate } },
    }),
    prisma.creditLedger.groupBy({
      by: ["type"],
      where: {
        clubId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      _sum: { amount: true },
    }),
  ]);

  const gmv = transactions.reduce((s, t) => s + t.amount, 0);
  const uniqueVisitors = new Set(visits.map((v) => v.userId)).size;
  const totalVisits = visits.length;
  const avgSpend = totalVisits > 0 ? gmv / totalVisits : 0;

  const creditsEarned = creditStats.find((s) => s.type === "EARN")?._sum?.amount ?? 0;
  const creditsRedeemed = Math.abs(
    creditStats.find((s) => s.type === "REDEEM")?._sum?.amount ?? 0
  );

  return NextResponse.json({
    gmv,
    uniqueVisitors,
    totalVisits,
    avgSpend: Math.round(avgSpend * 100) / 100,
    creditsEarned,
    creditsRedeemed,
  });
}
