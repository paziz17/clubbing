import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantBonusCredits } from "@/lib/credit";

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get("club_id");
  if (!clubId) {
    return NextResponse.json({ error: "club_id נדרש" }, { status: 400 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      filters: JSON.parse(c.filters),
      action: c.action,
      actionMeta: c.actionMeta ? JSON.parse(c.actionMeta) : null,
      runCount: c.runCount,
      createdAt: c.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { club_id, name, filters, action, action_meta } = body;

  if (!club_id || !name || !filters || !action) {
    return NextResponse.json(
      { error: "club_id, name, filters, action נדרשים" },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.create({
    data: {
      clubId: club_id,
      name,
      filters: JSON.stringify(filters),
      action,
      actionMeta: action_meta ? JSON.stringify(action_meta) : null,
    },
  });

  return NextResponse.json({
    id: campaign.id,
    name: campaign.name,
    filters: JSON.parse(campaign.filters),
    action: campaign.action,
  });
}
