import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { makeQrDataUrl } from "@/lib/qr";
import { sendEmail, ticketEmailHtml } from "@/lib/email";
import { formatDateHe, formatTimeHe } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body — fall back to the reservation's stored email
  }

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { event: { include: { venue: true } }, venue: true, user: true },
  });
  if (!reservation) {
    return NextResponse.json({ ok: false, error: "כרטיס לא נמצא" }, { status: 404 });
  }

  const to = body.email?.trim() || reservation.guestEmail || reservation.user?.email;
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "לא נמצאה כתובת מייל לשליחה" },
      { status: 400 }
    );
  }

  const qrUrl = await makeQrDataUrl(reservation.ticketCode);
  const html = ticketEmailHtml({
    customerName: reservation.user?.name ?? reservation.guestName ?? "אורח",
    eventName: reservation.event.name,
    date: `${formatDateHe(reservation.event.startsAt)} · ${formatTimeHe(reservation.event.startsAt)}`,
    venue: reservation.venue.name,
    qrUrl,
    ticketCode: reservation.ticketCode,
  });

  const result = await sendEmail({
    to,
    subject: `הכרטיס שלך ל-${reservation.event.name} · CLUBBING`,
    html,
  });

  return NextResponse.json({ ok: true, delivered: result.delivered, mode: result.mode, to });
}
