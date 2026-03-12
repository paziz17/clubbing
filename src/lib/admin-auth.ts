import { cookies } from "next/headers";

const ADMIN_USER = (process.env.ADMIN_USERNAME || "admin").trim();
const ADMIN_PASS = (process.env.ADMIN_PASSWORD || "admin").trim();
const ADMIN_COOKIE = "clubbing_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export async function setAdminSession(): Promise<void> {
  const secret = process.env.ADMIN_SECRET ?? "clubbing-admin-dev-secret";
  const token = Buffer.from(`${secret}:${Date.now()}`).toString("base64");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const secret = process.env.ADMIN_SECRET ?? "clubbing-admin-dev-secret";
  try {
    const decoded = Buffer.from(token, "base64").toString();
    return decoded.startsWith(`${secret}:`);
  } catch {
    return false;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
