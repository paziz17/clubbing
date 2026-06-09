import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { applyStockMovement } from "@/lib/inventory";
import { z } from "zod";

const schema = z.object({
  // IN | OUT | ADJUST | WASTE
  type: z.enum(["IN", "OUT", "ADJUST", "WASTE"]),
  qty: z.number().positive(),
  reason: z.string().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venue = await requireVenue();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { type, qty, reason } = parsed.data;

    // signed delta: IN adds, OUT/WASTE remove, ADJUST sets absolute via delta from client
    const signed = type === "IN" ? qty : type === "ADJUST" ? qty : -qty;

    const result = await applyStockMovement({
      venueId: venue.id,
      itemId: id,
      type,
      qty: signed,
      reason: reason ?? null,
    });
    return NextResponse.json({ item: result.item, movement: result.movement });
  } catch (err: any) {
    const status = err.message === "ITEM_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
