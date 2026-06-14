import { NextRequest, NextResponse } from "next/server";
import { requireVenueSession } from "@/lib/venue-session";
import { verifyTOTP } from "@/lib/totp";
import { db } from "@/lib/db";

// POST { secret, code } — confirm the authenticator works, then persist + enable.
export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireVenueSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.role !== "OWNER") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { secret, code } = await req.json().catch(() => ({}));
  if (!secret || !code) {
    return NextResponse.json({ error: "חסר קוד אימות" }, { status: 400 });
  }
  if (!verifyTOTP(secret, String(code))) {
    return NextResponse.json({ error: "קוד שגוי — נסה שוב" }, { status: 400 });
  }

  await db.venue.update({
    where: { id: ctx.venue.id },
    data: { totpSecret: secret, totpEnabled: true },
  });

  return NextResponse.json({ ok: true });
}
