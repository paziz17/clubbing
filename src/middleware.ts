import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { capabilityForPath, can, defaultLandingFor } from "@/lib/rbac";

const VENUE_SECRET = new TextEncoder().encode(
  process.env.VENUE_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret-clubbing"
);

// RBAC gate for CRM *pages* (APIs enforce server-side via requireCapability).
// Blocks a logged-in team member from opening a page their role can't access
// (e.g. a DOOR user navigating directly to /venue/transactions).
async function rbacRedirect(req: NextRequest, pathname: string): Promise<NextResponse | null> {
  if (pathname === "/venue/login" || pathname.startsWith("/api/")) return null;
  if (pathname !== "/venue" && !pathname.startsWith("/venue/")) return null;
  const token = req.cookies.get("venue_session")?.value;
  if (!token) return null; // no session -> let the layout redirect to login
  let role = "OWNER";
  try {
    const { payload } = await jwtVerify(token, VENUE_SECRET);
    role = ((payload as any).role as string) || "OWNER";
  } catch {
    return null;
  }
  const cap = capabilityForPath(pathname);
  if (cap && !can(role, cap)) {
    const url = req.nextUrl.clone();
    url.pathname = defaultLandingFor(role);
    url.search = "";
    return NextResponse.redirect(url);
  }
  return null;
}

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAlwaysAllowed(pathname)) return NextResponse.next();

  // App-level RBAC gating for CRM pages (independent of per-server ROLE).
  const rbac = await rbacRedirect(req, pathname);
  if (rbac) return rbac;

  if (!ROLE) return NextResponse.next();

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
