import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public: the bliner's phone loads the order summary to pay. Minimal fields.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await db.barOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      items: true,
      subtotalAgorot: true,
      venue: { select: { name: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({
    id: order.id,
    status: order.status,
    items: JSON.parse(order.items),
    subtotalAgorot: order.subtotalAgorot,
    venueName: order.venue.name,
  });
}
