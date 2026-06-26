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

  // Accept either the raw code or a URL that ends with the code.
  const code = raw.includes("/") ? raw.split("/").filter(Boolean).pop()! : raw;

  // ---- Per-ticket instance (one QR per seat) — primary path ----
  const instance = await db.ticketInstance.findFirst({
    where: { code, venueId: session.venueId },
    include: {
      reservation: { include: { event: true, user: true, ticketType: true } },
    },
  });
  if (instance) {
    const r = instance.reservation;
    const info = {
      id: r.id,
      name: r.user?.name ?? r.guestName ?? "אורח",
      eventName: r.event.name,
      ticketLabel: r.ticketType?.label ?? null,
      quantity: r.quantity,
      seat: `${instance.seat}/${r.quantity}`,
      ticketCode: instance.code.slice(0, 8).toUpperCase(),
    };
    if (instance.status === "VOID" || r.status === "REFUNDED" || r.status === "CANCELLED") {
      return NextResponse.json({ result: "invalid", reservation: info });
    }
    if (r.status !== "PAID") {
      return NextResponse.json({ result: "not_paid", status: r.status, reservation: info });
    }
    if (instance.status === "CHECKED_IN") {
      return NextResponse.json({
        result: "already_used",
        checkedInAt: instance.checkedInAt,
        reservation: info,
      });
    }
    await db.ticketInstance.update({
      where: { id: instance.id },
      data: { status: "CHECKED_IN", checkedInAt: new Date(), checkedInBy: session.username },
    });
    // Mark order-level summary once the first seat enters.
    if (!r.checkedInAt) {
      await db.reservation.update({
        where: { id: r.id },
        data: { checkedInAt: new Date(), checkedInBy: session.username },
      });
    }
    return NextResponse.json({ result: "valid", reservation: info });
  }

  // ---- Legacy fallback: order-level ticketCode ----
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
