import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { settleVenue } from "@/lib/payouts";
import { z } from "zod";

const schema = z.object({
  venueId: z.string(),
  bankRef: z.string().optional(),
  note: z.string().optional(),
});

// Platform admin records a manual bank transfer → resets the venue balance.
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const settlement = await settleVenue({
      venueId: parsed.data.venueId,
      bankRef: parsed.data.bankRef,
      note: parsed.data.note,
      settledBy: "platform-admin",
    });
    return NextResponse.json({ ok: true, settlement });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "settle failed" }, { status: 400 });
  }
}
