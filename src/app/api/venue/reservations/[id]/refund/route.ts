import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { refundReservation } from "@/lib/checkout";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let venue;
  try {
    ({ venue } = await requireCapability("refund"));
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "אין הרשאה לבצע החזר" : "Unauthorized" }, { status });
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
