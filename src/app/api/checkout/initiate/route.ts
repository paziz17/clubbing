import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initiate } from "@/lib/checkout";
import { z } from "zod";

const schema = z.object({
  eventId: z.string(),
  ticketTypeId: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
  paymentMethod: z.enum([
    "STRIPE_CARD",
    "APPLE_PAY",
    "GOOGLE_PAY",
    "CLUB_IT",
    "CREDITS",
    "MIXED",
    "DEMO",
  ]),
  guest: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  skippedAuth: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const result = await initiate({
      ...parsed.data,
      userId,
      origin,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "checkout failed" },
      { status: 500 }
    );
  }
}
