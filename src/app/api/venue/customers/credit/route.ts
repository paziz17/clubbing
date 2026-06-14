import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { adjustCredits } from "@/lib/credits";
import { db } from "@/lib/db";

// POST { cardId, amount, note } — manual credit grant/deduct from the CRM.
// amount is in credits (integer); positive grants, negative deducts.
export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireCapability("credit");
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json(
      { error: status === 403 ? "אין הרשאה לעדכן קרדיטים" : "Unauthorized" },
      { status }
    );
  }

  const { cardId, amount, note } = await req.json().catch(() => ({}));
  const amt = Number(amount);
  if (!cardId || !Number.isFinite(amt) || !Number.isInteger(amt) || amt === 0) {
    return NextResponse.json({ error: "סכום קרדיטים לא תקין" }, { status: 400 });
  }
  if (Math.abs(amt) > 100000) {
    return NextResponse.json({ error: "סכום חורג מהמותר" }, { status: 400 });
  }

  // Ensure the card exists (cross-venue cards are global; balance is per-venue).
  const card = await db.clubItCard.findUnique({ where: { id: cardId }, select: { id: true } });
  if (!card) return NextResponse.json({ error: "כרטיס לא נמצא" }, { status: 404 });

  try {
    const result = await adjustCredits({
      cardId,
      venueId: ctx.venue.id,
      amount: amt,
      note: typeof note === "string" ? note.slice(0, 200) : undefined,
      by: ctx.displayName,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "עדכון נכשל" }, { status: 400 });
  }
}
