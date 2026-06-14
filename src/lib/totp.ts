import speakeasy from "speakeasy";
import QRCode from "qrcode";

export function generateTotpSecret(label: string, issuer = "Clubbing CRM") {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${label})`,
    issuer,
    length: 20,
  });
  return {
    base32: secret.base32!,
    otpauth: secret.otpauth_url!,
  };
}

export function verifyTotpToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: token.replace(/\s/g, ""),
    window: 1, // allow 30s drift
  });
}

export async function generateQrDataUrl(otpauth: string): Promise<string> {
  return QRCode.toDataURL(otpauth, { width: 280, margin: 2 });
}
