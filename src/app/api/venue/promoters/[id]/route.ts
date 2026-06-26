import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireCapability("promoters");
    const promoter = await db.promoter.findUnique({ where: { id }, select: { venueId: true } });
    if (!promoter || promoter.venueId !== ctx.venue.id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.phone === "string") data.phone = body.phone || null;
    if (typeof body.email === "string") data.email = body.email || null;
    if (typeof body.commissionPct === "number") {
      data.commissionPct = Math.max(0, Math.min(100, body.commissionPct));
    }
    if (typeof body.active === "boolean") data.active = body.active;

    const updated = await db.promoter.update({ where: { id }, data });
    return NextResponse.json({ promoter: updated });
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
    const ctx = await requireCapability("promoters");
    const promoter = await db.promoter.findUnique({ where: { id }, select: { venueId: true } });
    if (!promoter || promoter.venueId !== ctx.venue.id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    // Soft-delete: keep historical attribution, just deactivate.
    await db.promoter.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
