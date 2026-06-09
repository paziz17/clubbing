import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const venue = await requireVenue();
    const body = await req.json();
    const settings = await db.venueSettings.upsert({
      where: { venueId: venue.id },
      create: { venueId: venue.id, ...body },
      update: body,
    });
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
