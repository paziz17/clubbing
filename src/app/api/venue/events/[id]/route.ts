import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

// Only these fields may be patched from the CRM. Prevents arbitrary writes.
const ALLOWED_STATUS = new Set(["DRAFT", "PUBLISHED", "ENDED"]);
const ALLOWED_POLICY = new Set(["AUTO", "MANUAL"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venue = await requireVenue();
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.basePriceAgorot === "number") data.basePriceAgorot = body.basePriceAgorot;
    if (typeof body.capacity === "number") data.capacity = body.capacity;
    if (typeof body.status === "string" && ALLOWED_STATUS.has(body.status)) data.status = body.status;
    if (typeof body.approvalPolicy === "string" && ALLOWED_POLICY.has(body.approvalPolicy)) {
      data.approvalPolicy = body.approvalPolicy;
    }
    if (typeof body.startsAt === "string") data.startsAt = new Date(body.startsAt);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "no valid fields" }, { status: 400 });
    }

    const event = await db.event.update({
      where: { id, venueId: venue.id },
      data,
    });
    return NextResponse.json({ event });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venue = await requireVenue();
    await db.event.delete({ where: { id, venueId: venue.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
