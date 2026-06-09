import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venue = await requireVenue();
    const body = await req.json();

    // shorthand actions
    if (body.action === "clockIn") {
      const shift = await db.shift.update({
        where: { id, venueId: venue.id },
        data: { clockInAt: new Date(), status: "CONFIRMED" },
        include: { employee: true },
      });
      return NextResponse.json({ shift });
    }
    if (body.action === "clockOut") {
      const shift = await db.shift.update({
        where: { id, venueId: venue.id },
        data: { clockOutAt: new Date(), status: "COMPLETED" },
        include: { employee: true },
      });
      return NextResponse.json({ shift });
    }

    const data: any = {};
    for (const k of ["role", "status", "breakMinutes", "notes", "eventId"]) {
      if (k in body) data[k] = body[k];
    }
    if (body.startsAt) data.startsAt = new Date(body.startsAt);
    if (body.endsAt) data.endsAt = new Date(body.endsAt);
    if (body.clockInAt !== undefined) data.clockInAt = body.clockInAt ? new Date(body.clockInAt) : null;
    if (body.clockOutAt !== undefined) data.clockOutAt = body.clockOutAt ? new Date(body.clockOutAt) : null;

    const shift = await db.shift.update({
      where: { id, venueId: venue.id },
      data,
      include: { employee: true },
    });
    return NextResponse.json({ shift });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venue = await requireVenue();
    await db.shift.delete({ where: { id, venueId: venue.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
