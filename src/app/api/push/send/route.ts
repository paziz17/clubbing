import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendToSubscriptions, pushConfigured } from "@/lib/push";

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

// Broadcast or targeted push. Protected by PUSH_SECRET / SYNC_SECRET.
// Body: { title, body?, url?, icon?, audience? }
//   audience: "all" (default) | { phones: string[] } | { endpoint: string }
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ ok: false, error: "vapid_not_configured" }, { status: 503 });

  let body: {
    title?: string; body?: string; url?: string; icon?: string;
    audience?: "all" | { phones?: string[]; endpoint?: string };
  };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 }); }
  if (!body.title) return NextResponse.json({ ok: false, error: "missing_title" }, { status: 400 });

  const aud = body.audience ?? "all";
  const where: { active: boolean; phone?: { in: string[] }; endpoint?: string } = { active: true };
  if (aud !== "all") {
    if (aud.endpoint) where.endpoint = aud.endpoint;
    else if (aud.phones?.length) where.phone = { in: aud.phones };
  }

  const subs = await db.pushSubscription.findMany({
    where,
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  const res = await sendToSubscriptions(subs, {
    title: body.title, body: body.body, url: body.url, icon: body.icon,
  });

  return NextResponse.json({ ok: true, audience: subs.length, ...res });
}
