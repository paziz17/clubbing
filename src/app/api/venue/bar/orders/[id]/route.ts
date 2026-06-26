import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { db } from "@/lib/db";

// Bartender polls this for the live payment status of a tab.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireCapability("bar");
    const order = await db.barOrder.findFirst({
      where: { id, venueId: ctx.venue.id },
      select: { id: true, status: true, subtotalAgorot: true, paidAt: true },
    });
    if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// Bartender can cancel an unpaid tab.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireCapability("bar");
    const order = await db.barOrder.findFirst({
      where: { id, venueId: ctx.venue.id },
      select: { id: true, status: true },
    });
    if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (order.status === "PENDING_PAYMENT") {
      await db.barOrder.update({ where: { id }, data: { status: "CANCELLED" } });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
