import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { venueId, newPassword } = await req.json();
  if (!venueId || !newPassword)
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.venue.update({ where: { id: venueId }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}
