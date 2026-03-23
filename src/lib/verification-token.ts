import { createHash, randomInt } from "crypto";

const SECRET = () => process.env.AUTH_SECRET ?? "dev-only-change-me";

/** קוד אימות בן 6 ספרות */
export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashVerificationCode(email: string, code: string): string {
  return createHash("sha256")
    .update(`${SECRET()}:${email.toLowerCase().trim()}:${code}`)
    .digest("hex");
}
