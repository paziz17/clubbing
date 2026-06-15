import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { scrapeGoOut } from "@/lib/goout-scraper";
import { scrapeZygo } from "@/lib/zygo-scraper";
import { scrapeAirdrop } from "@/lib/airdrop-scraper";
import type { ScrapedEvent } from "@/lib/scraped-event";

// All aggregated sources share one neutral "national index" venue.
const VENUE_SLUG = "go-out-import";
const VENUE_USERNAME = "goout-import";
const VENUE_NAME = "אינדקס אירועים ארצי";
const VENUE_DESC = "אירועים מתעדכנים אוטומטית מרחבי הארץ. מוצגים לצפייה בלבד.";

const SOURCES = ["go-out", "zygo", "airdrop"] as const;
type Source = (typeof SOURCES)[number];

async function ensureVenue(): Promise<string> {
  const venue = await db.venue.findUnique({ where: { slug: VENUE_SLUG } });
  if (!venue) {
    const passwordHash = await bcrypt.hash("goout-readonly-2026", 10);
    const created = await db.venue.create({
      data: {
        slug: VENUE_SLUG,
        name: VENUE_NAME,
        username: VENUE_USERNAME,
        passwordHash,
        description: VENUE_DESC,
        address: "תל אביב-יפו",
        city: "תל אביב-יפו",
        lat: 32.0853,
        lng: 34.7818,
        isExclusive: false,
        kitchenEnabled: false,
      },
    });
    return created.id;
  }
  if (venue.name !== VENUE_NAME || venue.description !== VENUE_DESC) {
    await db.venue.update({
      where: { id: venue.id },
      data: { name: VENUE_NAME, description: VENUE_DESC },
    });
  }
  return venue.id;
}

async function upsertEvent(
  venueId: string,
  source: Source,
  ev: ScrapedEvent,
): Promise<"created" | "updated"> {
  const existing = await db.event.findFirst({
    where: { source, externalId: ev.externalId },
    select: { id: true },
  });

  const data = {
    venueId,
    name: ev.title,
    description: ev.description,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    type: "PARTY",
    genres: ev.genres,
    area: ev.city,
    imageUrl: ev.imageUrl,
    basePriceAgorot: ev.minPriceAgorot,
    status: "PUBLISHED",
    tags: `${source}-import`,
    lat: ev.lat,
    lng: ev.lng,
    source,
    externalId: ev.externalId,
    externalUrl: ev.externalUrl,
  };

  if (existing) {
    await db.event.update({ where: { id: existing.id }, data });
    return "updated";
  }
  await db.event.create({ data });
  return "created";
}

async function expireOldEvents(venueId: string) {
  await db.event.updateMany({
    where: {
      venueId,
      source: { in: SOURCES as unknown as string[] },
      status: "PUBLISHED",
      startsAt: { lt: new Date() },
    },
    data: { status: "ENDED" },
  });
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return true;
  const auth =
    req.headers.get("x-sync-secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  return auth === secret;
}

// POST /api/sync/events — scrape & upsert every aggregated source.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();
  const venueId = await ensureVenue();

  const scrapers: Record<Source, () => Promise<{ events: ScrapedEvent[]; errors: string[] }>> = {
    "go-out": scrapeGoOut,
    zygo: scrapeZygo,
    airdrop: scrapeAirdrop,
  };

  const perSource: Record<string, { scraped: number; created: number; updated: number; errors: string[] }> = {};

  for (const source of SOURCES) {
    try {
      const { events, errors } = await scrapers[source]();
      let created = 0, updated = 0;
      for (const ev of events) {
        const res = await upsertEvent(venueId, source, ev);
        if (res === "created") created++;
        else updated++;
      }
      perSource[source] = { scraped: events.length, created, updated, errors };
    } catch (err) {
      perSource[source] = { scraped: 0, created: 0, updated: 0, errors: [(err as Error).message] };
    }
  }

  await expireOldEvents(venueId);

  const elapsed = Date.now() - startMs;
  const stats = { perSource, elapsed_ms: elapsed };
  console.log("[sync/events]", JSON.stringify(stats));
  return NextResponse.json({ ok: true, ...stats });
}

// GET — health / counts per source.
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const counts: Record<string, number> = {};
  for (const source of SOURCES) {
    counts[source] = await db.event.count({ where: { source, status: "PUBLISHED" } });
  }
  return NextResponse.json({ live_events_by_source: counts });
}
