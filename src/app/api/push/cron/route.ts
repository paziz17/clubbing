import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOne, pushConfigured } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authed(req: NextRequest): boolean {
  const secret = process.env.PUSH_SECRET || process.env.SYNC_SECRET;
  if (!secret) return true;
  const got =
    req.headers.get("x-push-secret") ||
    req.headers.get("x-sync-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  return got === secret;
}

// Fire all due event reminders. Triggered by the pm2 cron (every ~15 min).
async function run() {
  if (!pushConfigured()) return { ok: false, error: "vapid_not_configured" };

  const now = new Date();
  const due = await db.pushReminder.findMany({
    where: { sentAt: null, fireAt: { lte: now } },
    include: { subscription: true },
    take: 500,
  });

  let sent = 0, failed = 0, removed = 0;
  const goneSubs: string[] = [];
  for (const r of due) {
    if (!r.subscription || !r.subscription.active) {
      // skip dead subscription but mark the reminder handled so we don't retry
      await db.pushReminder.update({ where: { id: r.id }, data: { sentAt: now } });
      continue;
    }
    const res = await sendOne(
      { endpoint: r.subscription.endpoint, p256dh: r.subscription.p256dh, auth: r.subscription.auth },
      { title: r.title, body: r.body ?? "האירוע מתחיל בקרוב 🎉", url: r.url ?? "https://clubbing.co.il", tag: `ev-${r.eventKey}` },
    );
    if (res.ok) sent++;
    else { failed++; if (res.gone) goneSubs.push(r.subscription.id); }
    await db.pushReminder.update({ where: { id: r.id }, data: { sentAt: now } });
  }
  if (goneSubs.length) {
    removed = goneSubs.length;
    await db.pushSubscription.updateMany({ where: { id: { in: goneSubs } }, data: { active: false } });
  }
  return { ok: true, due: due.length, sent, failed, removed };
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}
