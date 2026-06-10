import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "crm_admin_session";
const SECRET = new TextEncoder().encode(
  process.env.VENUE_SESSION_SECRET ?? "dev-admin-secret"
);

export async function createAdminSession() {
  const token = await new SignJWT({ role: "superadmin" } as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.HTTPS_ENABLED === "true",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getAdminSession(): Promise<boolean> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return false;
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
