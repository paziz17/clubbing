import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hours before an event we fire the "tonight" reminder.
const LEAD_HOURS = 4;

// Register a reminder for a saved event. Called when a user bookmarks an event
// while push is enabled. Idempotent per (subscription, event).
export async function POST(req: NextRequest) {
  let body: { endpoint?: string; eventKey?: string; title?: string; body?: string; url?: string; startsAt?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 }); }

  const { endpoint, eventKey, title, startsAt } = body;
  if (!endpoint || !eventKey || !title || !startsAt) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return NextResponse.json({ ok: false, error: "bad_date" }, { status: 400 });

  const sub = await db.pushSubscription.findUnique({ where: { endpoint } });
  if (!sub) return NextResponse.json({ ok: false, error: "no_subscription" }, { status: 404 });

  // Fire LEAD_HOURS before the event; if it's already closer than that, the
  // next cron run picks it up immediately.
  const fireAt = new Date(start.getTime() - LEAD_HOURS * 60 * 60 * 1000);

  await db.pushReminder.upsert({
    where: { subscriptionId_eventKey: { subscriptionId: sub.id, eventKey } },
    update: { title, body: body.body ?? null, url: body.url ?? null, fireAt, sentAt: null },
    create: { subscriptionId: sub.id, eventKey, title, body: body.body ?? null, url: body.url ?? null, fireAt },
  });

  return NextResponse.json({ ok: true });
}

// Remove a reminder when the user unsaves the event.
export async function DELETE(req: NextRequest) {
  let body: { endpoint?: string; eventKey?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 }); }
  if (!body.endpoint || !body.eventKey) return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  const sub = await db.pushSubscription.findUnique({ where: { endpoint: body.endpoint } });
  if (sub) {
    await db.pushReminder.deleteMany({ where: { subscriptionId: sub.id, eventKey: body.eventKey } });
  }
  return NextResponse.json({ ok: true });
}
