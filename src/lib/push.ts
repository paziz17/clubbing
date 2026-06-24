import webpush from "web-push";
import { db } from "@/lib/db";

// VAPID config is read from env. The private key never leaves the server; the
// public key is also exposed (read-only) via /api/push/key for the website.
let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:info@clubbing.co.il";
  if (pub && priv) {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
  }
  return configured;
}

export function vapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
}

export function pushConfigured(): boolean {
  return !!(process.env.VAPID_PRIVATE_KEY && vapidPublicKey());
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
  tag?: string;
};

type RawSub = { id?: string; endpoint: string; p256dh: string; auth: string };

// Send a single notification. Returns { gone:true } for expired subscriptions
// (404/410) so the caller can deactivate them.
export async function sendOne(sub: RawSub, payload: PushPayload): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!ensureConfigured()) return { ok: false, error: "vapid_not_configured" };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({
        title: payload.title,
        body: payload.body ?? "",
        url: payload.url ?? "https://clubbing.co.il",
        icon: payload.icon ?? "/icon.png",
        tag: payload.tag,
      }),
      { TTL: 60 * 60 * 24 },
    );
    return { ok: true };
  } catch (e: unknown) {
    const code = (e as { statusCode?: number })?.statusCode;
    if (code === 404 || code === 410) return { ok: false, gone: true };
    return { ok: false, error: String((e as { message?: string })?.message || e) };
  }
}

// Send to many stored subscriptions, deactivating any that are gone.
export async function sendToSubscriptions(
  subs: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number; removed: number }> {
  let sent = 0, failed = 0, removed = 0;
  const goneIds: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      const r = await sendOne(s, payload);
      if (r.ok) sent++;
      else { failed++; if (r.gone) goneIds.push(s.id); }
    }),
  );
  if (goneIds.length) {
    removed = goneIds.length;
    await db.pushSubscription.updateMany({ where: { id: { in: goneIds } }, data: { active: false } });
  }
  if (sent) {
    await db.pushSubscription.updateMany({
      where: { id: { in: subs.map((s) => s.id) } },
      data: { lastSentAt: new Date() },
    });
  }
  return { sent, failed, removed };
}
