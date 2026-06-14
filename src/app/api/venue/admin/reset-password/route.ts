import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

// POST { venueId, newPassword } — reset a venue's master (OWNER) password.
export async function POST(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { venueId, newPassword } = await req.json().catch(() => ({}));
  if (!venueId || typeof newPassword !== "string" || newPassword.length < 6) {
    return NextResponse.json(
      { ok: false, error: "סיסמה חייבת להיות 6 תווים לפחות" },
      { status: 400 }
    );
  }

  const venue = await db.venue.findUnique({ where: { id: venueId }, select: { id: true } });
  if (!venue)
    return NextResponse.json({ ok: false, error: "מועדון לא נמצא" }, { status: 404 });

  await db.venue.update({
    where: { id: venueId },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  return NextResponse.json({ ok: true });
}
