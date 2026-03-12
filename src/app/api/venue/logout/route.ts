import { NextResponse } from "next/server";
import { clearVenueSession } from "@/lib/venue-auth";

export async function POST() {
  await clearVenueSession();
  return NextResponse.json({ success: true });
}
