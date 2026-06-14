import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { generateSmsOtp, verifySmsOtp, sendSmsOtp } from "@/lib/sms-otp";

// GET: get current SMS settings
export async function GET() {
  const venue = await requireVenue();
  const v = await db.venue.findUnique({ where: { id: venue.id }, select: { phone: true, smsOtpEnabled: true } });
  return NextResponse.json({ phone: v?.phone ?? null, smsOtpEnabled: v?.smsOtpEnabled ?? false });
}

// PUT: save phone number + send verification code
export async function PUT(req: NextRequest) {
  const venue = await requireVenue();
  const { phone } = await req.json();
  const normalized = phone?.trim().replace(/\s/g, '') ?? '';
  if (!/^\+\d{10,15}$/.test(normalized)) {
    return NextResponse.json({ ok: false, error: 'מספר טלפון לא תקין — השתמש בפורמט +972501234567' });
  }
  await db.venue.update({ where: { id: venue.id }, data: { phone: normalized, smsOtpEnabled: false } });
  const code = generateSmsOtp(venue.id + '_verify');
  await sendSmsOtp(normalized, code);
  return NextResponse.json({ ok: true, message: 'קוד אימות נשלח' });
}

// POST: verify phone code → enable SMS OTP
export async function POST(req: NextRequest) {
  const venue = await requireVenue();
  const { code } = await req.json();
  const result = verifySmsOtp(venue.id + '_verify', code);
  if (result !== 'ok') {
    return NextResponse.json({ ok: false, error: result === 'expired' ? 'קוד פג תוקף — שלח שוב' : 'קוד שגוי' });
  }
  await db.venue.update({ where: { id: venue.id }, data: { smsOtpEnabled: true } });
  return NextResponse.json({ ok: true });
}

// DELETE: disable SMS OTP
export async function DELETE() {
  const venue = await requireVenue();
  await db.venue.update({ where: { id: venue.id }, data: { smsOtpEnabled: false, phone: null } });
  return NextResponse.json({ ok: true });
}
