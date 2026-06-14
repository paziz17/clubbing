import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

// POST { email, name, venueId?, note? } — grant a user platform VIP status
// by issuing / upgrading their Club-it card to PLATINUM (top tier).
export async function POST(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { email, name, venueId } = await req.json().catch(() => ({}));
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return NextResponse.json({ ok: false, error: "כתובת מייל לא תקינה" }, { status: 400 });
  }

  const displayName = String(name ?? "").trim() || cleanEmail.split("@")[0];

  let user = await db.user.findUnique({ where: { email: cleanEmail } });
  if (!user) {
    user = await db.user.create({
      data: { email: cleanEmail, name: displayName },
    });
  } else if (name && user.name !== displayName) {
    user = await db.user.update({ where: { id: user.id }, data: { name: displayName } });
  }

  const last4 = String(Math.floor(1000 + Math.random() * 9000));
  const card = await db.clubItCard.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      cardNumberLast4: last4,
      displayName,
      tier: "PLATINUM",
    },
    update: { tier: "PLATINUM", isActive: true },
  });

  // Optionally seed a balance row scoped to a specific venue.
  if (venueId) {
    const venue = await db.venue.findUnique({ where: { id: venueId }, select: { id: true } });
    if (venue) {
      await db.userBalance.upsert({
        where: { cardId_venueId: { cardId: card.id, venueId } },
        create: { cardId: card.id, venueId },
        update: {},
      });
    }
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
