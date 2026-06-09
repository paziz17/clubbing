/**
 * Separate, lightweight session for the venue CRM (independent of bliner NextAuth).
 * Uses a signed JWT in an HttpOnly cookie ("venue_session").
 */

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE_NAME = "venue_session";
const SECRET = new TextEncoder().encode(
  process.env.VENUE_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret-clubbing"
);

interface VenuePayload {
  venueId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export async function createVenueSession(venueId: string, username: string) {
  const token = await new SignJWT({ venueId, username } as any)
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

export async function requireVenue() {
  const session = await getVenueFromCookie();
  if (!session) throw new Error("UNAUTHORIZED");
  const venue = await db.venue.findUnique({
    where: { id: session.venueId },
    include: { settings: true },
  });
  if (!venue) throw new Error("UNAUTHORIZED");
  return venue;
}
