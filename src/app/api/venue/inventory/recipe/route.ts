import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  menuItemId: z.string(),
  inventoryItemId: z.string(),
  qtyPerUnit: z.number().positive(),
});

// list recipe links for a given menu item
export async function GET(req: NextRequest) {
  try {
    const venue = await requireVenue();
    const menuItemId = new URL(req.url).searchParams.get("menuItemId");
    if (!menuItemId) return NextResponse.json({ links: [] });
    const links = await db.menuItemIngredient.findMany({
      where: { menuItemId, menuItem: { venueId: venue.id } },
      include: { inventoryItem: true },
    });
    return NextResponse.json({ links });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const venue = await requireVenue();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { menuItemId, inventoryItemId, qtyPerUnit } = parsed.data;

    // make sure both belong to this venue
    const [menuItem, inv] = await Promise.all([
      db.foodMenuItem.findFirst({ where: { id: menuItemId, venueId: venue.id } }),
      db.inventoryItem.findFirst({ where: { id: inventoryItemId, venueId: venue.id } }),
    ]);
    if (!menuItem || !inv) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const link = await db.menuItemIngredient.upsert({
      where: { menuItemId_inventoryItemId: { menuItemId, inventoryItemId } },
      create: { menuItemId, inventoryItemId, qtyPerUnit },
      update: { qtyPerUnit },
      include: { inventoryItem: true },
    });
    return NextResponse.json({ link });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
