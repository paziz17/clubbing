import { NextResponse } from "next/server";

// בודק אם משתני OAuth מוגדרים (בלי לחשוף ערכים)
export async function GET() {
  const hasGoogle =
    !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;
  const hasAuthUrl = !!process.env.AUTH_URL;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;

  const authUrl = (process.env.AUTH_URL || "").trim();
  return NextResponse.json({
    google: hasGoogle,
    authUrl: hasAuthUrl,
    nextAuthUrl: hasNextAuthUrl,
    authUrlValue: authUrl || "(לא מוגדר)",
    authUrlCorrect: authUrl === "https://clubbing-two.vercel.app",
    ready: hasGoogle && (hasAuthUrl || hasNextAuthUrl),
  });
}
