import { NextRequest, NextResponse } from "next/server";
import { getVenueFromCookie } from "@/lib/venue-session";
import { db } from "@/lib/db";

/**
 * Verify + check in a ticket at the door by its QR payload (ticketCode).
 *
 * Results:
 *  - valid        : paid ticket, now marked as entered
 *  - already_used : was already checked in (returns when + who)
 *  - not_paid     : reservation exists but is PENDING / FAILED / REFUNDED / CANCELLED
 *  - invalid      : no such ticket for this venue
 */
export async function POST(req: NextRequest) {
  const session = await getVenueFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const raw = String(body.code ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Accept either the raw ticketCode or a tickets URL that ends with the code.
  const code = raw.includes("/") ? raw.split("/").filter(Boolean).pop()! : raw;

  const reservation = await db.reservation.findFirst({
    where: { ticketCode: code, venueId: session.venueId },
    include: { event: true, user: true, ticketType: true },
  });

  if (!reservation) {
    return NextResponse.json({ result: "invalid" });
  }

  const info = {
    id: reservation.id,
    name: reservation.user?.name ?? reservation.guestName ?? "אורח",
    eventName: reservation.event.name,
    ticketLabel: reservation.ticketType?.label ?? null,
    quantity: reservation.quantity,
    ticketCode: reservation.ticketCode.slice(0, 8).toUpperCase(),
  };

  if (reservation.status !== "PAID") {
    return NextResponse.json({
      result: "not_paid",
      status: reservation.status,
      reservation: info,
    });
  }

  if (reservation.checkedInAt) {
    return NextResponse.json({
      result: "already_used",
      checkedInAt: reservation.checkedInAt,
      reservation: info,
    });
  }

  await db.reservation.update({
    where: { id: reservation.id },
    data: { checkedInAt: new Date(), checkedInBy: session.username },
  });

  return NextResponse.json({ result: "valid", reservation: info });
}
