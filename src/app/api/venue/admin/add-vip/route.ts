import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name, venueId, note } = await req.json();
  if (!email) return NextResponse.json({ error: "נדרש מייל" }, { status: 400 });

  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        id: "vip-" + Date.now(),
        email,
        name: name || email.split("@")[0],
        role: "USER",
        isGuest: false,
      },
    });
  } else if (name) {
    await db.user.update({ where: { id: user.id }, data: { name } });
  }

  const existingCard = await db.clubItCard.findUnique({ where: { userId: user.id } });
  let card;
  if (existingCard) {
    card = await db.clubItCard.update({
      where: { userId: user.id },
      data: { tier: "VIP", isActive: true },
    });
  } else {
    card = await db.clubItCard.create({
      data: {
        userId: user.id,
        cardNumberLast4: String(Math.floor(1000 + Math.random() * 9000)),
        displayName: (name || email.split("@")[0]).toUpperCase(),
        tier: "VIP",
        isActive: true,
      },
    });
  }

  if (venueId) {
    await db.userBalance.upsert({
      where: { cardId_venueId: { cardId: card.id, venueId } },
      create: { cardId: card.id, venueId, creditsBalance: 0, creditsAccrued: 0, creditsRedeemed: 0 },
      update: {},
    });
  }

  return NextResponse.json({ ok: true, userId: user.id, tier: "VIP" });
}
