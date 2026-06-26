import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const venue = await requireVenue();
  const body = await req.json();
  const item = await db.foodMenuItem.create({
    data: {
      venueId: venue.id,
      name: body.name,
      section: body.section === "BAR" ? "BAR" : "RESTAURANT",
      category: body.category,
      priceAgorot: body.priceAgorot,
      prepMinutes: body.prepMinutes ?? 15,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
    },
  });
  return NextResponse.json({ item });
}
