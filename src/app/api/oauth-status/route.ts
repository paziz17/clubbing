import { NextRequest, NextResponse } from "next/server";

// בודק אם משתני OAuth מוגדרים (בלי לחשוף ערכים)
export async function GET(req: NextRequest) {
  const hasGoogle =
    !!(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
    !!(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET);
  const hasAuthUrl = !!process.env.AUTH_URL;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;

  const authUrl = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "")
    .trim()
    .replace(/\/$/, "");
  const redirectUri = authUrl
    ? `${authUrl}/api/auth/callback/google`
    : "(לא מוגדר — הגדר AUTH_URL או NEXTAUTH_URL)";

  // מה ה-URL שבאמת מגיע מהבקשה — NextAuth משתמש בזה ל-redirect_uri (עם trustHost)
  const host = req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const requestOrigin = host ? `${proto}://${host}` : "(לא ידוע)";
  const actualRedirectUri = requestOrigin !== "(לא ידוע)"
    ? `${requestOrigin}/api/auth/callback/google`
    : redirectUri;

  return NextResponse.json({
    google: hasGoogle,
    authUrl: hasAuthUrl,
    nextAuthUrl: hasNextAuthUrl,
    authUrlValue: authUrl || "(לא מוגדר)",
    redirectUriUsed: actualRedirectUri,
    redirectUriFromEnv: redirectUri,
    redirectUriInGoogle:
      "חייב להיות זהה בדיוק ל־Authorized redirect URIs ב־Google Cloud Console",
    requestOrigin,
    authUrlCorrect: authUrl === "https://clubbing-two.vercel.app",
    ready: hasGoogle,
  });
}
