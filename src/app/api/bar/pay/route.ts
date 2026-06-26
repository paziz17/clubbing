import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { payBarOrder } from "@/lib/bar";
import { z } from "zod";

const schema = z.object({
  orderId: z.string(),
  method: z.enum(["CARD", "WALLET"]),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const result = await payBarOrder({
      orderId: parsed.data.orderId,
      method: parsed.data.method,
      userId,
      origin,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "payment failed" }, { status: 400 });
  }
}
