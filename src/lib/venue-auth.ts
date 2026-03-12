import { cookies } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const VENUE_COOKIE = "clubbing_venue";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function verifyVenueCredentials(username: string, password: string): Promise<string | null> {
  if (!username || !password) return null;
  const hash = hashPassword(password);
  const venue = await prisma.venue.findFirst({
    where: {
      OR: [
        { loginName: username },
        { name: username },
      ],
    },
  });
  if (!venue || venue.passwordHash !== hash) return null;
  return venue.id;
}

export async function setVenueSession(venueId: string): Promise<void> {
  const secret = process.env.ADMIN_SECRET ?? "clubbing-admin-dev-secret";
  const token = Buffer.from(`${secret}:venue:${venueId}:${Date.now()}`).toString("base64");
  const cookieStore = await cookies();
  cookieStore.set(VENUE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getVenueId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VENUE_COOKIE)?.value;
  if (!token) return null;
  const secret = process.env.ADMIN_SECRET ?? "clubbing-admin-dev-secret";
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const parts = decoded.split(":");
    if (parts[0] !== secret || parts[1] !== "venue") return null;
    return parts[2] ?? null;
  } catch {
    return null;
  }
}

export async function clearVenueSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(VENUE_COOKIE);
}
