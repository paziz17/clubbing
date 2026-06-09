import { NextRequest, NextResponse } from "next/server";

// Per-server role isolation.
// Each server builds with its own APP_ROLE in .env:
//   CRM server  -> APP_ROLE=crm  (serves only the venue CRM)
//   APP server  -> APP_ROLE=app  (serves only the mobile app)
// Undefined role => no restriction (backward compatible).
const ROLE = process.env.APP_ROLE;

// Framework / static / shared assets — always allowed on every role.
function isAlwaysAllowed(p: string): boolean {
  return (
    p.startsWith("/_next") ||
    p.startsWith("/icons") ||
    p.startsWith("/images") ||
    p.startsWith("/fonts") ||
    p === "/favicon.ico" ||
    p === "/manifest.json" ||
    p === "/manifest.webmanifest" ||
    p === "/robots.txt" ||
    p === "/sitemap.xml" ||
    p === "/sw.js" ||
    p.startsWith("/api/health")
  );
}

// Venue APIs the mobile app legitimately needs (public discovery), allowed on the APP server.
function isSharedVenueApi(p: string): boolean {
  return p.startsWith("/api/venue/nearby") || p.startsWith("/api/venue/by-slug");
}

// CRM-owned pages (venue login, venue CRM dashboard, admin portal/decoy).
function isCrmPage(p: string): boolean {
  return p === "/venue" || p.startsWith("/venue/");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAlwaysAllowed(pathname) || !ROLE) return NextResponse.next();

  if (ROLE === "crm") {
    // Allow CRM pages + all venue APIs. Block every mobile-app surface.
    if (isCrmPage(pathname) || pathname.startsWith("/api/venue")) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return new NextResponse("Not found", { status: 404 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/venue/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (ROLE === "app") {
    // Block CRM pages + sensitive venue APIs. Allow shared venue APIs + everything else.
    if (isCrmPage(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/api/venue") && !isSharedVenueApi(pathname)) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
