/**
 * Separate, lightweight session for the venue CRM (independent of the bliner NextAuth).
 * Uses a signed JWT in an HttpOnly cookie ("venue_session").
 *
 * Supports two login identities:
 *  - Venue master login (legacy)  -> role OWNER, no userId.
 *  - VenueUser team account        -> role from the user record + userId.
 */

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { normalizeRole, can, type Capability, type Role } from "./rbac";

const COOKIE_NAME = "venue_session";
const SECRET = new TextEncoder().encode(
  process.env.VENUE_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret-clubbing"
);

interface VenuePayload {
  venueId: string;
  username: string;
  userId?: string | null;
  role?: string;
  displayName?: string;
  iat?: number;
  exp?: number;
}

export async function createVenueSession(
  venueId: string,
  username: string,
  opts?: { userId?: string | null; role?: string; displayName?: string }
) {
  const token = await new SignJWT({
    venueId,
    username,
    userId: opts?.userId ?? null,
    role: normalizeRole(opts?.role ?? "OWNER"),
    displayName: opts?.displayName ?? username,
  } as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // secure only when HTTPS is actually available
    secure: process.env.HTTPS_ENABLED === "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroyVenueSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getVenueFromCookie(): Promise<VenuePayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as VenuePayload;
  } catch {
    return null;
  }
}

/** Role of the current session. Legacy tokens (no role) are treated as OWNER. */
export async function getSessionRole(): Promise<Role> {
  const s = await getVenueFromCookie();
  return normalizeRole(s?.role ?? "OWNER");
}

export interface VenueSessionContext {
  venue: NonNullable<Awaited<ReturnType<typeof loadVenue>>>;
  role: Role;
  userId: string | null;
  displayName: string;
}

async function loadVenue(venueId: string) {
  return db.venue.findUnique({ where: { id: venueId }, include: { settings: true } });
}

/** Returns the venue (unchanged signature). Throws UNAUTHORIZED when not logged in. */
export async function requireVenue() {
  const session = await getVenueFromCookie();
  if (!session) throw new Error("UNAUTHORIZED");
  const venue = await loadVenue(session.venueId);
  if (!venue) throw new Error("UNAUTHORIZED");
  return venue;
}

/** Returns the full session context (venue + role + identity). */
export async function requireVenueSession(): Promise<VenueSessionContext> {
  const session = await getVenueFromCookie();
  if (!session) throw new Error("UNAUTHORIZED");
  const venue = await loadVenue(session.venueId);
  if (!venue) throw new Error("UNAUTHORIZED");
  return {
    venue,
    role: normalizeRole(session.role ?? "OWNER"),
    userId: session.userId ?? null,
    displayName: session.displayName ?? venue.name,
  };
}

/** Requires the current session to hold a capability. Throws FORBIDDEN otherwise. */
export async function requireCapability(cap: Capability) {
  const ctx = await requireVenueSession();
  if (!can(ctx.role, cap)) throw new Error("FORBIDDEN");
  return ctx;
}
