import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { createBarOrder } from "@/lib/bar";
import { z } from "zod";

const schema = z.object({
  items: z
    .array(z.object({ id: z.string(), qty: z.number().int().min(1).max(50) }))
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireCapability("bar");
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const order = await createBarOrder({
      venueId: ctx.venue.id,
      bartenderId: ctx.userId,
      bartenderName: ctx.displayName,
      items: parsed.data.items,
    });
    return NextResponse.json({
      orderId: order.id,
      subtotalAgorot: order.subtotalAgorot,
      status: order.status,
    });
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
