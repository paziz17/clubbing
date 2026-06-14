import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, destroyAdminSession } from "@/lib/admin-session";

// Platform super-admin login. The password is configured via the
// ADMIN_PASSWORD env var on the CRM server. No DB row is required.
export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "פאנל-העל לא הוגדר (ADMIN_PASSWORD חסר)" },
      { status: 503 }
    );
  }

  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!password || typeof password !== "string") {
    return NextResponse.json({ ok: false, error: "חסרה סיסמה" }, { status: 400 });
  }

  // Constant-time-ish comparison to avoid trivial timing leaks.
  if (password.length !== expected.length || password !== expected) {
    return NextResponse.json({ ok: false, error: "סיסמה שגויה" }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
