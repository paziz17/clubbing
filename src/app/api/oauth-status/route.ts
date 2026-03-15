import { NextResponse } from "next/server";

// בודק אם משתני OAuth מוגדרים (בלי לחשוף ערכים)
export async function GET() {
  const hasGoogle =
    !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;
  const hasAuthUrl = !!process.env.AUTH_URL;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;

  return NextResponse.json({
    google: hasGoogle,
    authUrl: hasAuthUrl,
    nextAuthUrl: hasNextAuthUrl,
    authUrlValue: process.env.AUTH_URL || "(לא מוגדר)",
    ready: hasGoogle && (hasAuthUrl || hasNextAuthUrl),
  });
}
