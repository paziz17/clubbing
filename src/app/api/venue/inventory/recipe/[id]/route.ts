import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venue = await requireVenue();
    // ensure the link belongs to a menu item of this venue
    const link = await db.menuItemIngredient.findFirst({
      where: { id, menuItem: { venueId: venue.id } },
    });
    if (!link) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    await db.menuItemIngredient.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
