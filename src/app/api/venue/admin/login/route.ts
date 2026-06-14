import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-session";
import { verifyTotpToken } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const { username, password, totpToken } = await req.json();

  const validUser = process.env.SUPER_ADMIN_USERNAME ?? "admin";
  const validPass = process.env.SUPER_ADMIN_PASSWORD ?? "Clubbing2026!";
  const totpSecret = process.env.SUPER_ADMIN_TOTP_SECRET;

  if (username !== validUser || password !== validPass) {
    return NextResponse.json({ ok: false, error: "פרטי גישה שגויים" }, { status: 401 });
  }

  // ── Google Authenticator (TOTP) ──
  if (totpSecret) {
    if (!totpToken) return NextResponse.json({ ok: false, needsTotp: true });
    if (!verifyTotpToken(totpSecret, totpToken)) {
      return NextResponse.json({ ok: false, error: "קוד אימות שגוי" }, { status: 401 });
    }
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
