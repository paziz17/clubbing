import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { db } from "@/lib/db";

async function ownsTicket(ticketId: string, venueId: string) {
  const t = await db.ticketType.findUnique({
    where: { id: ticketId },
    select: { id: true, event: { select: { venueId: true } } },
  });
  return t && t.event.venueId === venueId ? t : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireCapability("events");
    if (!(await ownsTicket(id, ctx.venue.id))) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.label === "string") data.label = body.label;
    if (typeof body.kind === "string") data.kind = body.kind;
    if (typeof body.priceAgorot === "number") data.priceAgorot = body.priceAgorot;
    if (body.stock === null || typeof body.stock === "number") data.stock = body.stock;
    if (typeof body.active === "boolean") data.active = body.active;
    if (body.salesStartAt === null || typeof body.salesStartAt === "string") {
      data.salesStartAt = body.salesStartAt ? new Date(body.salesStartAt) : null;
    }
    if (body.salesEndAt === null || typeof body.salesEndAt === "string") {
      data.salesEndAt = body.salesEndAt ? new Date(body.salesEndAt) : null;
    }

    const ticket = await db.ticketType.update({ where: { id }, data });
    return NextResponse.json({ ticket });
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireCapability("events");
    if (!(await ownsTicket(id, ctx.venue.id))) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const used = await db.reservation.count({ where: { ticketTypeId: id } });
    if (used > 0) {
      // Keep history — just deactivate.
      await db.ticketType.update({ where: { id }, data: { active: false } });
      return NextResponse.json({ ok: true, deactivated: true });
    }
    await db.ticketType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
