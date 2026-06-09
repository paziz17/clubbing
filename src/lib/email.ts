/**
 * Email integration — uses Resend if RESEND_API_KEY is set, otherwise logs to console.
 */

interface SendParams {
  to: string;
  subject: string;
  html: string;
}

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: SendParams) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "CLUBBING <noreply@clubbing.app>";

  if (!key) {
    console.log(`[email:demo] to=${to} subject="${subject}"`);
    return { delivered: false as const, mode: "demo" as const };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) throw new Error(await res.text());
    return { delivered: true as const, mode: "resend" as const };
  } catch (err) {
    console.error("Resend send failed:", err);
    return { delivered: false as const, mode: "error" as const };
  }
}

export function ticketEmailHtml(args: {
  customerName: string;
  eventName: string;
  date: string;
  venue: string;
  qrUrl: string;
  ticketCode: string;
}) {
  return `<!doctype html>
<html dir="rtl" lang="he">
  <body style="font-family: -apple-system, sans-serif; background: #06060A; color: #F5F1E6; padding: 24px;">
    <div style="max-width: 480px; margin: 0 auto; background: #10101A; border: 1px solid #23232F; border-radius: 16px; overflow: hidden;">
      <div style="padding: 24px; text-align: center; border-bottom: 1px solid #23232F;">
        <h1 style="margin: 0; color: #D4AF37; letter-spacing: 4px; font-size: 22px;">CLUBBING</h1>
      </div>
      <div style="padding: 28px;">
        <p style="font-size: 14px; color: #9A9387; margin: 0 0 8px;">היי ${args.customerName},</p>
        <h2 style="margin: 0 0 16px; color: #D4AF37;">הכרטיס שלך מוכן ✓</h2>
        <div style="background: #06060A; border: 1px solid #23232F; border-radius: 12px; padding: 20px;">
          <p style="margin: 0; font-size: 18px;"><strong>${args.eventName}</strong></p>
          <p style="margin: 8px 0; color: #9A9387; font-size: 14px;">${args.date}</p>
          <p style="margin: 8px 0; color: #9A9387; font-size: 14px;">${args.venue}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <img src="${args.qrUrl}" alt="QR" width="200" height="200" style="background: white; padding: 12px; border-radius: 12px;" />
          <p style="font-family: monospace; color: #D4AF37; margin: 12px 0 0;">${args.ticketCode}</p>
        </div>
        <p style="font-size: 12px; color: #5E5A4F; text-align: center;">סרוק את הקוד בכניסה למועדון</p>
      </div>
    </div>
  </body>
</html>`;
}
