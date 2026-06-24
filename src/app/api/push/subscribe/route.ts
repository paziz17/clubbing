import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Register (or refresh) a browser push subscription. Called server-to-server
// from the website proxy, so no CORS is required.
export async function POST(req: NextRequest) {
  let body: {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    phone?: string; email?: string; userId?: string; origin?: string; userAgent?: string;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 }); }

  const sub = body.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "missing_subscription" }, { status: 400 });
  }

  const data = {
    p256dh, auth,
    phone: body.phone?.trim() || null,
    email: body.email?.trim().toLowerCase() || null,
    userId: body.userId || null,
    origin: body.origin || null,
    userAgent: body.userAgent || req.headers.get("user-agent") || null,
    active: true,
  };

  const saved = await db.pushSubscription.upsert({
    where: { endpoint },
    update: data,
    create: { endpoint, ...data },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
