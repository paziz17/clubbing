import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createVenueSession } from "@/lib/venue-session";
import { defaultLandingFor, normalizeRole } from "@/lib/rbac";
import { verifyTOTP } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const { username, password, totpCode } = await req.json();
  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "missing credentials" },
      { status: 400 }
    );
  }

  // 1) Team account (VenueUser) takes precedence.
  const teamUser = await db.venueUser.findUnique({ where: { username } });
  if (teamUser) {
    if (!teamUser.active) {
      return NextResponse.json({ ok: false, error: "המשתמש מושבת" }, { status: 403 });
    }
    const valid = await bcrypt.compare(password, teamUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "סיסמה שגויה" }, { status: 401 });
    }
    const role = normalizeRole(teamUser.role);
    await db.venueUser.update({
      where: { id: teamUser.id },
      data: { lastLoginAt: new Date() },
    });
    await createVenueSession(teamUser.venueId, teamUser.username, {
      userId: teamUser.id,
      role,
      displayName: teamUser.name,
    });
    return NextResponse.json({ ok: true, venueId: teamUser.venueId, role, redirect: defaultLandingFor(role) });
  }

  // 2) Legacy venue master login -> OWNER.
  const venue = await db.venue.findUnique({ where: { username } });
  if (!venue) {
    return NextResponse.json({ ok: false, error: "משתמש לא קיים" }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, venue.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "סיסמה שגויה" }, { status: 401 });
  }

  // Optional 2FA on the master (OWNER) login — only enforced when enabled.
  if (venue.totpEnabled && venue.totpSecret) {
    if (!totpCode) {
      return NextResponse.json({ ok: false, twofa: true }, { status: 401 });
    }
    if (!verifyTOTP(venue.totpSecret, String(totpCode))) {
      return NextResponse.json(
        { ok: false, twofa: true, error: "קוד אימות שגוי" },
        { status: 401 }
      );
    }
  }

  await createVenueSession(venue.id, venue.username, {
    role: "OWNER",
    displayName: venue.name,
  });
  return NextResponse.json({ ok: true, venueId: venue.id, role: "OWNER", redirect: "/venue" });
}
