import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { scrapeGoOut } from "@/lib/goout-scraper";
import { scrapeZygo } from "@/lib/zygo-scraper";
import { scrapeAirdrop } from "@/lib/airdrop-scraper";
import { type ScrapedEvent, clusterEvents } from "@/lib/scraped-event";

// All aggregated sources share one neutral "national index" venue.
const VENUE_SLUG = "go-out-import";
const VENUE_USERNAME = "goout-import";
const VENUE_NAME = "אינדקס אירועים ארצי";
const VENUE_DESC = "אירועים מתעדכנים אוטומטית מרחבי הארץ. מוצגים לצפייה בלבד.";

const SOURCES = ["go-out", "zygo", "airdrop"] as const;
type Source = (typeof SOURCES)[number];

// Tiebreaker when two sources describe the same event — higher wins.
const SOURCE_PRIORITY: Record<Source, number> = { "go-out": 3, zygo: 2, airdrop: 1 };

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

// Data-richness score so the most complete copy of a duplicate survives.
function richness(opts: {
  imageUrl?: string | null;
  basePriceAgorot?: number | null;
  description?: string | null;
  source: Source;
}): number {
  let s = 0;
  if (opts.imageUrl) s += 2;
  if ((opts.basePriceAgorot ?? 0) > 0) s += 2;
  if (opts.description) s += 1;
  return s * 10 + SOURCE_PRIORITY[opts.source];
}

async function upsertEvent(venueId: string, source: Source, ev: ScrapedEvent): Promise<"created" | "updated"> {
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

/**
 * Collapse cross-source duplicates among the venue's published events:
 * cluster by club-night + similar title, keep the richest copy, mark the rest
 * ENDED. Idempotent, so it also cleans duplicates created by earlier syncs.
 */
async function dedupePublished(venueId: string): Promise<number> {
  const events = await db.event.findMany({
    where: { venueId, source: { in: SOURCES as unknown as string[] }, status: "PUBLISHED" },
    select: { id: true, source: true, name: true, startsAt: true, imageUrl: true, basePriceAgorot: true, description: true, updatedAt: true },
  });

  const clusters = clusterEvents(events, (e) => e.name, (e) => e.startsAt);

  const loserIds: string[] = [];
  for (const arr of clusters) {
    if (arr.length < 2) continue;
    arr.sort((a, b) => {
      const ra = richness({ imageUrl: a.imageUrl, basePriceAgorot: a.basePriceAgorot, description: a.description, source: a.source as Source });
      const rb = richness({ imageUrl: b.imageUrl, basePriceAgorot: b.basePriceAgorot, description: b.description, source: b.source as Source });
      if (rb !== ra) return rb - ra;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
    for (let i = 1; i < arr.length; i++) loserIds.push(arr[i].id);
  }

  if (loserIds.length) {
    await db.event.updateMany({ where: { id: { in: loserIds } }, data: { status: "ENDED" } });
  }
  return loserIds.length;
}

async function expireOldEvents(venueId: string) {
  await db.event.updateMany({
    where: { venueId, source: { in: SOURCES as unknown as string[] }, status: "PUBLISHED", startsAt: { lt: new Date() } },
    data: { status: "ENDED" },
  });
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("x-sync-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  return auth === secret;
}

// POST /api/sync/events — scrape every source, dedupe across sources, upsert.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const startMs = Date.now();
  const venueId = await ensureVenue();

  const scrapers: Record<Source, () => Promise<{ events: ScrapedEvent[]; errors: string[] }>> = {
    "go-out": scrapeGoOut,
    zygo: scrapeZygo,
    airdrop: scrapeAirdrop,
  };

  // 1) Scrape all sources.
  const scrapedStats: Record<string, { scraped: number; errors: string[] }> = {};
  const combined: { source: Source; ev: ScrapedEvent }[] = [];
  for (const source of SOURCES) {
    try {
      const { events, errors } = await scrapers[source]();
      scrapedStats[source] = { scraped: events.length, errors };
      for (const ev of events) combined.push({ source, ev });
    } catch (err) {
      scrapedStats[source] = { scraped: 0, errors: [(err as Error).message] };
    }
  }

  // 2) Cross-source dedup — cluster same-event copies, keep the richest one.
  const clusters = clusterEvents(combined, (c) => c.ev.title, (c) => c.ev.startsAt);
  const winners: { source: Source; ev: ScrapedEvent }[] = [];
  for (const cluster of clusters) {
    const best = cluster.reduce((a, b) => {
      const ra = richness({ imageUrl: a.ev.imageUrl, basePriceAgorot: a.ev.minPriceAgorot, description: a.ev.description, source: a.source });
      const rb = richness({ imageUrl: b.ev.imageUrl, basePriceAgorot: b.ev.minPriceAgorot, description: b.ev.description, source: b.source });
      return rb > ra ? b : a;
    });
    winners.push(best);
  }

  // 3) Upsert winners.
  let created = 0, updated = 0;
  for (const { source, ev } of winners) {
    const res = await upsertEvent(venueId, source, ev);
    if (res === "created") created++;
    else updated++;
  }

  // 4) Clean past + duplicate rows still sitting in the DB.
  await expireOldEvents(venueId);
  const deduped = await dedupePublished(venueId);

  const elapsed = Date.now() - startMs;
  const stats = {
    bySource: scrapedStats,
    scraped_total: combined.length,
    unique_after_dedup: winners.length,
    created,
    updated,
    duplicates_collapsed: deduped,
    elapsed_ms: elapsed,
  };
  console.log("[sync/events]", JSON.stringify(stats));
  return NextResponse.json({ ok: true, ...stats });
}

// GET — health / counts per source.
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const counts: Record<string, number> = {};
  for (const source of SOURCES) {
    counts[source] = await db.event.count({ where: { source, status: "PUBLISHED" } });
  }
  return NextResponse.json({ live_events_by_source: counts });
}
