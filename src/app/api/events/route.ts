import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_EVENTS } from "@/lib/demo-events";

// קואורדינטות ערים — נקודת ייחוס למיון לפי מרחק
const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  "תל אביב": { lat: 32.0808, lng: 34.7805 },
  "חיפה": { lat: 32.813, lng: 34.999 },
  "ירושלים": { lat: 31.769, lng: 35.216 },
  "אילת": { lat: 29.558, lng: 34.951 },
  "הרצליה": { lat: 32.163, lng: 34.844 },
  "רמת גן": { lat: 32.085, lng: 34.812 },
  "נהריה": { lat: 33.005, lng: 35.099 },
  "עכו": { lat: 32.928, lng: 35.082 },
  "כרמיאל": { lat: 32.909, lng: 35.293 },
  "טבריה": { lat: 32.793, lng: 35.531 },
  "נתניה": { lat: 32.331, lng: 34.858 },
  "באר שבע": { lat: 31.252, lng: 34.791 },
  "מצפה רמון": { lat: 30.609, lng: 34.801 },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ללא cache — נתונים תמיד מעודכנים
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const region = req.nextUrl.searchParams.get("region");
    const userLat = req.nextUrl.searchParams.get("lat");
    const userLng = req.nextUrl.searchParams.get("lng");
    const music = req.nextUrl.searchParams.get("music");
    const eventType = req.nextUrl.searchParams.get("eventType");
    const age = req.nextUrl.searchParams.get("age");

    const events = await prisma.event.findMany({
      where: {
        status: "approved",
        ...(region && { location: { contains: region } }),
      },
      orderBy: { date: "asc" },
    });

    let filtered = events;
    if (music) {
      filtered = filtered.filter((e) => {
        const tags = JSON.parse(e.tags || "[]") as string[];
        return tags.some((t) => t.toLowerCase().includes(music.toLowerCase()));
      });
    }
    if (eventType) {
      filtered = filtered.filter((e) => {
        const tags = JSON.parse(e.tags || "[]") as string[];
        return tags.some((t) => t.toLowerCase().includes(eventType.toLowerCase()));
      });
    }
    if (age) {
      const minAge = parseInt(age, 10) || 18;
      filtered = filtered.filter((e) => {
        const restriction = e.ageRestriction?.replace("+", "") || "18";
        return parseInt(restriction, 10) <= minAge;
      });
    }

    // מיון מהכי קרוב להכי רחוק
    let ref = REGION_COORDS["תל אביב"];
    if (userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      if (!isNaN(lat) && !isNaN(lng)) ref = { lat, lng };
    } else if (region && REGION_COORDS[region]) {
      ref = REGION_COORDS[region];
    }
    filtered.sort((a, b) => {
      const distA = a.lat != null && a.lng != null ? haversineKm(ref.lat, ref.lng, a.lat, a.lng) : 9999;
      const distB = b.lat != null && b.lng != null ? haversineKm(ref.lat, ref.lng, b.lat, b.lng) : 9999;
      return distA - distB;
    });

    return NextResponse.json(
      filtered.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        date: e.date.toISOString(),
        time: e.time,
        location: e.location,
        address: e.address,
        imageUrl: e.imageUrl,
        ticketLink: e.ticketLink,
        phone: e.phone,
        ageRestriction: e.ageRestriction,
        tags: JSON.parse(e.tags || "[]"),
      }))
    );
  } catch (err) {
    console.error("[api/events]", err);
    return NextResponse.json(DEMO_EVENTS, { status: 200 });
  }
}
