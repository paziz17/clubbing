import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public VAPID key so the website can subscribe the browser. Read-only.
export async function GET() {
  const key = vapidPublicKey();
  return NextResponse.json(
    { ok: !!key, key: key ?? null },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=600" } },
  );
}
