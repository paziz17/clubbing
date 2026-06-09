import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().default("OTHER"),
  unit: z.string().default("UNIT"),
  stockQty: z.number().default(0),
  parLevel: z.number().default(0),
  reorderQty: z.number().default(0),
  unitCostAgorot: z.number().int().min(0).default(0),
  supplierId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const venue = await requireVenue();
    const items = await db.inventoryItem.findMany({
      where: { venueId: venue.id },
      include: { supplier: true },
      orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const venue = await requireVenue();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { stockQty, ...rest } = parsed.data;
    const item = await db.inventoryItem.create({
      data: { venueId: venue.id, stockQty, ...rest },
    });
    // record opening balance as a movement for the ledger
    if (stockQty && stockQty !== 0) {
      await db.stockMovement.create({
        data: { venueId: venue.id, itemId: item.id, type: "IN", qty: stockQty, reason: "מלאי פתיחה" },
      });
    }
    return NextResponse.json({ item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
