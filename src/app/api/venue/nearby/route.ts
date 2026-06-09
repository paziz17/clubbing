import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { distanceKm } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  const venues = await db.venue.findMany({
    where: { lat: { not: null }, lng: { not: null } },
  });
  const fourHrsAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  const enriched = await Promise.all(
    venues.map(async (v) => {
      const km = distanceKm({ lat, lng }, { lat: v.lat!, lng: v.lng! });
      const buddies = await db.checkIn.count({
        where: { venueId: v.id, createdAt: { gte: fourHrsAgo } },
      });
      return {
        id: v.id,
        name: v.name,
        city: v.city,
        km: Math.round(km * 10) / 10,
        activeBuddies: buddies,
      };
    })
  );

  enriched.sort((a, b) => a.km - b.km);
  return NextResponse.json({ venues: enriched.slice(0, 10) });
}
