import { NextResponse } from "next/server";
import { destroyVenueSession } from "@/lib/venue-session";

export async function POST() {
  await destroyVenueSession();
  return NextResponse.json({ ok: true });
}
