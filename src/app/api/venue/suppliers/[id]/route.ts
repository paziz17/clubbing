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
    const data: any = {};
    for (const k of ["name", "phone", "email", "notes"]) {
      if (k in body) data[k] = body[k];
    }
    const supplier = await db.supplier.update({
      where: { id, venueId: venue.id },
      data,
    });
    return NextResponse.json({ supplier });
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
    await db.supplier.delete({ where: { id, venueId: venue.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
