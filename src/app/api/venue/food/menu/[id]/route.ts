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
  // Whitelist editable fields (avoid mass-assignment of venueId/id/etc).
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (body.section === "BAR" || body.section === "RESTAURANT") data.section = body.section;
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.priceAgorot === "number") data.priceAgorot = body.priceAgorot;
  if (typeof body.prepMinutes === "number") data.prepMinutes = body.prepMinutes;
  if (typeof body.description === "string" || body.description === null) data.description = body.description;
  if (typeof body.imageUrl === "string" || body.imageUrl === null) data.imageUrl = body.imageUrl;
  if (typeof body.active === "boolean") data.active = body.active;
  const item = await db.foodMenuItem.update({
    where: { id, venueId: venue.id },
    data,
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
