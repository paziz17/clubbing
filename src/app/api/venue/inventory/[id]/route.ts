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
    for (const k of ["name", "category", "unit", "parLevel", "reorderQty", "unitCostAgorot", "supplierId", "sku", "active"]) {
      if (k in body) data[k] = body[k];
    }
    // stockQty is only changed via movements, never edited directly here
    const item = await db.inventoryItem.update({
      where: { id, venueId: venue.id },
      data,
      include: { supplier: true },
    });
    return NextResponse.json({ item });
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
    await db.inventoryItem.update({
      where: { id, venueId: venue.id },
      data: { active: false },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
