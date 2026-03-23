import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nightlife-loyalty-mvp-secret"
);

export interface JWTPayload {
  userId: string;
  phone: string;
  role?: string;
  clubId?: string;
  exp?: number;
}

export async function signToken(payload: { userId: string; phone: string }) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateQRToken(): string {
  return crypto.randomUUID() + "-" + Date.now().toString(36);
}
