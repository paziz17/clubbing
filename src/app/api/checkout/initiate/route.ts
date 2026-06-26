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
    "GROW",
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

  // Promoter attribution from the tracking cookie (set by /r/<code>?e=<eventId>).
  // Only honoured when the cookie's eventId matches the event being purchased.
  let promoterCode: string | undefined;
  const ref = req.cookies.get("clubbing_ref")?.value;
  if (ref) {
    const [refEventId, code] = ref.split(":");
    if (refEventId === parsed.data.eventId && code) promoterCode = code;
  }

  try {
    const result = await initiate({
      ...parsed.data,
      userId,
      promoterCode,
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
