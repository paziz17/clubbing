import nodemailer from "nodemailer";

const APP_NAME = "Clubing";

function buildVerificationHtml(name: string, code: string): string {
  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:linear-gradient(180deg,#141414 0%,#0d0d0d 100%);border-radius:20px;border:1px solid rgba(212,175,55,0.35);overflow:hidden;">
          <tr>
            <td style="padding:36px 28px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.25em;color:#d4af37;text-transform:uppercase;">${APP_NAME}</p>
              <h1 style="margin:0 0 16px;font-size:22px;color:#f5e6a8;">שלום${name ? `, ${escapeHtml(name)}` : ""}</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#b4b4b4;">
                כדי להשלים את הרישום לאתר, הזן באתר את קוד האימות הבא:
              </p>
              <div style="display:inline-block;padding:18px 36px;border-radius:14px;background:linear-gradient(135deg,#f0d78c,#d4af37,#a67c00);margin-bottom:24px;">
                <span style="font-size:32px;font-weight:800;letter-spacing:0.35em;color:#0a0a0a;font-family:ui-monospace,monospace;">${escapeHtml(code)}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#6b6b6b;">הקוד תקף ל־24 שעות. אם לא ביקשת להירשם — התעלם מהמייל.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SendMailResult = { ok: true; via: "smtp" } | { ok: true; via: "console"; devCode: string } | { ok: false; error: string };

export async function sendVerificationEmail(
  to: string,
  name: string,
  code: string
): Promise<SendMailResult> {
  const html = buildVerificationHtml(name, code);
  const text = `שלום${name ? ` ${name}` : ""},\n\nקוד האימות שלך ל-${APP_NAME}: ${code}\n\nהקוד תקף ל-24 שעות.`;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user ?? "noreply@localhost";

  if (!host || !user || !pass) {
    console.warn(`[${APP_NAME} mail] SMTP לא מוגדר — קוד אימות ל-${to}: ${code}`);
    return { ok: true, via: "console", devCode: code };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"${APP_NAME}" <${from}>`,
      to,
      subject: `${APP_NAME} — קוד אימות הרישום`,
      text,
      html,
    });
    return { ok: true, via: "smtp" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "שגיאת שליחה";
    console.error("[mail]", e);
    return { ok: false, error: msg };
  }
}
