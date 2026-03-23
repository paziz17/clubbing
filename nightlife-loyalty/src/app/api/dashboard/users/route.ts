import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get("club_id");
  const tier = req.nextUrl.searchParams.get("tier");

  if (!clubId) {
    return NextResponse.json({ error: "club_id נדרש" }, { status: 400 });
  }

  const [visits, txByUser] = await Promise.all([
    prisma.visit.findMany({ where: { clubId }, include: { user: true } }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where: { clubId },
      _sum: { amount: true },
    }),
  ]);

  const visitCountByUser = visits.reduce(
    (acc, v) => {
      acc[v.userId] = (acc[v.userId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const usersMap = new Map(visits.map((v) => [v.userId, v.user]));
  for (const tx of txByUser) {
    if (!usersMap.has(tx.userId)) {
      const u = await prisma.user.findUnique({ where: { id: tx.userId } });
      if (u) usersMap.set(u.id, u);
    }
  }

  const users = Array.from(usersMap.entries()).map(([userId, user]) => {
    const tx = txByUser.find((t) => t.userId === userId);
    const visitsCount = visitCountByUser[userId] || 0;
    const spend = tx?._sum?.amount ?? 0;

    let userTier = "Light";
    if (visitsCount >= 10 && spend >= 5000) userTier = "VIP";
    else if (visitsCount >= 5 && spend >= 2000) userTier = "Heavy";
    else if (visitsCount >= 2 && spend >= 500) userTier = "Regular";

    return {
      id: user.id,
      name: user.name,
      tier: userTier,
      visits: visitsCount,
      spend: Math.round(spend * 100) / 100,
    };
  });

  const filtered = tier ? users.filter((u) => u.tier === tier) : users;

  return NextResponse.json(filtered.sort((a, b) => b.spend - a.spend));
}
