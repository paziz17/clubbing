/**
 * WhatsApp Business Cloud API integration for Club Bot.
 * Activates automatically when WHATSAPP_PHONE_ID and WHATSAPP_ACCESS_TOKEN are set.
 * Falls back to wa.me deep links for manual sending.
 */

interface SendParams {
  to: string;     // E.164 phone number (without +)
  message: string;
}

export const isWhatsAppConfigured = () =>
  Boolean(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN);

export async function sendWhatsApp({ to, message }: SendParams) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    return {
      delivered: false as const,
      mode: "fallback" as const,
      waMeUrl: `https://wa.me/${to.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    return { delivered: true as const, mode: "cloud-api" as const };
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return {
      delivered: false as const,
      mode: "fallback" as const,
      waMeUrl: `https://wa.me/${to.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
    };
  }
}

export const CAMPAIGN_TEMPLATES = {
  CHASER_50: {
    label: "צ׳ייסר 50% לנשים",
    emoji: "🥃",
    message:
      "היי! הערב במועדון — צ׳ייסר 50% לנשים. הציגי את ההודעה הזו לברמן.",
  },
  FREE_ENTRY_WOMEN: {
    label: "כניסה חינם לנשים עד 00:00",
    emoji: "🎟",
    message:
      "הערב — כניסה חינם לנשים עד חצות. הציגי את ההודעה הזו בכניסה.",
  },
  FREE_FIRST_DRINK_WOMEN_18: {
    label: "משקה ראשון חינם לנשים +18",
    emoji: "🍸",
    message:
      "הערב — משקה ראשון חינם לנשים מגיל 18+. הציגי את ההודעה לברמן.",
  },
} as const;

export type CampaignTemplateKey = keyof typeof CAMPAIGN_TEMPLATES;
