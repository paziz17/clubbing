import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  kind: z.enum(["STANDARD", "VIP", "EARLY_BIRD"]).default("STANDARD"),
  label: z.string().min(1),
  priceAgorot: z.number().int().min(0),
  stock: z.number().int().min(0).nullable().optional(),
  salesStartAt: z.string().datetime().nullable().optional(),
  salesEndAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireCapability("events");
    const event = await db.event.findFirst({
      where: { id, venueId: ctx.venue.id },
      select: { id: true },
    });
    if (!event) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const ticket = await db.ticketType.create({
      data: {
        eventId: id,
        kind: parsed.data.kind,
        label: parsed.data.label,
        priceAgorot: parsed.data.priceAgorot,
        stock: parsed.data.stock ?? null,
        salesStartAt: parsed.data.salesStartAt ? new Date(parsed.data.salesStartAt) : null,
        salesEndAt: parsed.data.salesEndAt ? new Date(parsed.data.salesEndAt) : null,
        active: parsed.data.active ?? true,
      },
    });
    return NextResponse.json({ ticket });
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
