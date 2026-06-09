import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const venue = await requireVenue();
  const body = await req.json();
  const item = await db.foodMenuItem.update({
    where: { id, venueId: venue.id },
    data: body,
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const venue = await requireVenue();
  await db.foodMenuItem.delete({ where: { id, venueId: venue.id } });
  return NextResponse.json({ ok: true });
}
