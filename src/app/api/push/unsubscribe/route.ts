import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deactivate a subscription when the user turns notifications off.
export async function POST(req: NextRequest) {
  let body: { endpoint?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 }); }
  if (!body.endpoint) return NextResponse.json({ ok: false, error: "missing_endpoint" }, { status: 400 });
  await db.pushSubscription.updateMany({ where: { endpoint: body.endpoint }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
