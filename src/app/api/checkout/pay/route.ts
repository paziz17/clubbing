import { NextRequest, NextResponse } from "next/server";
import { payApprovedReservation } from "@/lib/checkout";
import { z } from "zod";

const schema = z.object({
  reservationId: z.string(),
  token: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  try {
    const result = await payApprovedReservation(
      parsed.data.reservationId,
      parsed.data.token,
      origin
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "payment failed" }, { status: 400 });
  }
}
