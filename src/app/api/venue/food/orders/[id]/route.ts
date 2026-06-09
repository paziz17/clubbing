import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const venue = await requireVenue();
  const { status } = await req.json();
  const order = await db.foodOrder.update({
    where: { id, venueId: venue.id },
    data: { status },
  });
  return NextResponse.json({ order });
}
