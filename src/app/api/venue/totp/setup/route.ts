import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { generateTotpSecret, generateQrDataUrl, verifyTotpToken } from "@/lib/totp";

export async function GET(_req: NextRequest) {
  const venue = await requireVenue();
  const { base32, otpauth } = generateTotpSecret(venue.username);
  const qrDataUrl = await generateQrDataUrl(otpauth);
  await db.venue.update({ where: { id: venue.id }, data: { totpSecret: base32, totpEnabled: false } });
  return NextResponse.json({ base32, qrDataUrl });
}

export async function POST(req: NextRequest) {
  const venue = await requireVenue();
  const { token } = await req.json();
  const dbVenue = await db.venue.findUnique({ where: { id: venue.id } });
  if (!dbVenue?.totpSecret) return NextResponse.json({ ok: false, error: "אין secret" }, { status: 400 });
  if (!verifyTotpToken(dbVenue.totpSecret, token)) return NextResponse.json({ ok: false, error: "קוד שגוי — נסה שוב" });
  await db.venue.update({ where: { id: venue.id }, data: { totpEnabled: true } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest) {
  const venue = await requireVenue();
  await db.venue.update({ where: { id: venue.id }, data: { totpSecret: null, totpEnabled: false } });
  return NextResponse.json({ ok: true });
}
