import { NextRequest, NextResponse } from "next/server";
import { requireVenueSession } from "@/lib/venue-session";
import { verifyTOTP } from "@/lib/totp";
import { db } from "@/lib/db";

// POST { code } — verify a current code, then turn 2FA off and wipe the secret.
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

  const venue = await db.venue.findUnique({
    where: { id: ctx.venue.id },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!venue?.totpEnabled || !venue.totpSecret) {
    return NextResponse.json({ ok: true });
  }

  const { code } = await req.json().catch(() => ({}));
  if (!code || !verifyTOTP(venue.totpSecret, String(code))) {
    return NextResponse.json({ error: "קוד שגוי" }, { status: 400 });
  }

  await db.venue.update({
    where: { id: ctx.venue.id },
    data: { totpSecret: null, totpEnabled: false },
  });

  return NextResponse.json({ ok: true });
}
