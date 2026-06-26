import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { approveReservation } from "@/lib/checkout";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireCapability("reservations");

    const reservation = await db.reservation.findUnique({
      where: { id },
      select: { venueId: true },
    });
    if (!reservation || reservation.venueId !== ctx.venue.id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const result = await approveReservation(
      id,
      ctx.userId ?? ctx.displayName,
      origin
    );
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
