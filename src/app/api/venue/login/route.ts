import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createVenueSession } from "@/lib/venue-session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "missing credentials" },
      { status: 400 }
    );
  }
  const venue = await db.venue.findUnique({ where: { username } });
  if (!venue) {
    return NextResponse.json({ ok: false, error: "משתמש לא קיים" }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, venue.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "סיסמה שגויה" }, { status: 401 });
  }
  await createVenueSession(venue.id, venue.username);
  return NextResponse.json({ ok: true, venueId: venue.id });
}
