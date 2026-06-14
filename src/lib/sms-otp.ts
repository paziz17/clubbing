import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: "us-east-1" });

// In-memory OTP store: key = venueId, value = { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

export function generateSmsOtp(venueId: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(venueId, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
  });
  return code;
}

export function verifySmsOtp(venueId: string, inputCode: string): "ok" | "expired" | "invalid" | "too_many" {
  const entry = otpStore.get(venueId);
  if (!entry) return "expired";
  if (Date.now() > entry.expiresAt) { otpStore.delete(venueId); return "expired"; }
  if (entry.attempts >= 5) { otpStore.delete(venueId); return "too_many"; }
  entry.attempts++;
  if (entry.code !== inputCode.trim()) return "invalid";
  otpStore.delete(venueId);
  return "ok";
}

export async function sendSmsOtp(phone: string, code: string): Promise<void> {
  await sns.send(new PublishCommand({
    PhoneNumber: phone,
    Message: `קוד האימות שלך ל-Clubbing CRM: ${code}\nתקף ל-5 דקות.`,
    MessageAttributes: {
      "AWS.SNS.SMS.SMSType": { DataType: "String", StringValue: "Transactional" },
    },
  }));
}
