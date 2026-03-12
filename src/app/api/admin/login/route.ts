import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, setAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "נדרש שם משתמש וסיסמה" }, { status: 400 });
  }

  if (!verifyAdminCredentials(String(username), String(password))) {
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ success: true, redirect: "/admin" });
}
