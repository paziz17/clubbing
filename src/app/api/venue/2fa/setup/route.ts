import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireVenueSession } from "@/lib/venue-session";
import { generateBase32Secret, otpauthURL } from "@/lib/totp";

// POST — generate a fresh TOTP secret + provisioning QR. Does NOT enable 2FA;
// the caller must confirm a code via /enable. Owner-only.
export async function POST() {
  let ctx;
  try {
    ctx = await requireVenueSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.role !== "OWNER") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const secret = generateBase32Secret();
  const label = ctx.venue.username || ctx.venue.slug || ctx.venue.name;
  const url = otpauthURL(secret, label);
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 });

  return NextResponse.json({ secret, otpauth: url, qr });
}
