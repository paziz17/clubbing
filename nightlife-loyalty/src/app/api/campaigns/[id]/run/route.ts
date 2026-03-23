import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantBonusCredits } from "@/lib/credit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    return NextResponse.json({ error: "קמפיין לא נמצא" }, { status: 404 });
  }

  const filters = JSON.parse(campaign.filters) as {
    visited_in_last_days?: number;
    tier?: string;
    credit_balance_min?: number;
  };
  const actionMeta = campaign.actionMeta
    ? JSON.parse(campaign.actionMeta) as { credits?: number }
    : { credits: 10 };

  const club = await prisma.club.findUnique({
    where: { id: campaign.clubId },
  });
  if (!club) {
    return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
  }

  let userIds: string[] = [];

  if (filters.visited_in_last_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.visited_in_last_days);
    const visits = await prisma.visit.findMany({
      where: {
        clubId: campaign.clubId,
        checkInTime: { gte: cutoff },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    userIds = visits.map((v) => v.userId);
  } else {
    const visits = await prisma.visit.findMany({
      where: { clubId: campaign.clubId },
      select: { userId: true },
      distinct: ["userId"],
    });
    userIds = visits.map((v) => v.userId);
  }

  const credits = actionMeta.credits ?? 10;
  let granted = 0;

  for (const userId of userIds) {
    try {
      await grantBonusCredits(
        userId,
        campaign.clubId,
        credits,
        club.expirationDays,
        { campaignId: campaign.id }
      );
      granted++;
    } catch {
      // skip on error
    }
  }

  await prisma.campaign.update({
    where: { id },
    data: { runCount: { increment: 1 }, runAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    affected: granted,
    total: userIds.length,
  });
}
