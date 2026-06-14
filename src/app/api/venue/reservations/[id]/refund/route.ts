import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { refundReservation } from "@/lib/checkout";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let venue;
  try {
    venue = await requireVenue();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refundReservation(id, venue.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Refund failed" },
      { status: 400 }
    );
  }
}
