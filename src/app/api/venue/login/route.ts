import { NextRequest, NextResponse } from "next/server";
import { verifyVenueCredentials, setVenueSession } from "@/lib/venue-auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "נדרש שם משתמש וסיסמה" }, { status: 400 });
  }

  const venueId = await verifyVenueCredentials(String(username).trim(), String(password).trim());
  if (!venueId) {
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 });
  }

  await setVenueSession(venueId);
  return NextResponse.json({ success: true, redirect: "/venue" });
}
