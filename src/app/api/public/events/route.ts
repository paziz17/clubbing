import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public API — no auth required.
 * Used by the marketing website and any external consumer.
 *
 * GET /api/public/events
 *   ?limit=20        (default 20, max 100)
 *   ?source=go-out   (filter by source; omit for all)
 *   ?city=תל%20אביב  (fuzzy city filter)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const source = searchParams.get("source") ?? undefined;
  const city = searchParams.get("city") ?? undefined;

  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { gte: new Date() },
      ...(source ? { source } : {}),
      ...(city ? { area: { contains: city, mode: "insensitive" } } : {}),
    },
    include: { venue: { select: { name: true, slug: true, city: true, logoUrl: true } } },
    orderBy: { startsAt: "asc" },
    take: limit,
  });

  const payload = events.map((ev) => ({
    id: ev.id,
    title: ev.name,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    city: ev.area ?? ev.venue.city,
    venue: ev.venue.name,
    venueSlug: ev.venue.slug,
    imageUrl: ev.imageUrl,
    genres: ev.genres,
    priceILS: ev.basePriceAgorot / 100,
    source: ev.source ?? "native",
    externalUrl: ev.externalUrl ?? null,
    appUrl: `https://app.clubbing.co.il/events/${ev.id}`,
  }));

  return NextResponse.json(
    { count: payload.length, events: payload },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
