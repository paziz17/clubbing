import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { scrapeGoOut, type GoOutEvent } from "@/lib/goout-scraper";

const SOURCE = "go-out";
const VENUE_SLUG = "go-out-import";
const VENUE_USERNAME = "goout-import";

async function ensureVenue(): Promise<string> {
  let venue = await db.venue.findUnique({ where: { slug: VENUE_SLUG } });
  if (!venue) {
    const passwordHash = await bcrypt.hash("goout-readonly-2026", 10);
    venue = await db.venue.create({
      data: {
        slug: VENUE_SLUG,
        name: "GO-OUT (אינדקס חיצוני)",
        username: VENUE_USERNAME,
        passwordHash,
        description: "אירועים שנאספו אוטומטית מ-go-out.co. מוצגים לצפייה בלבד.",
        address: "תל אביב-יפו",
        city: "תל אביב-יפו",
        lat: 32.0853,
        lng: 34.7818,
        isExclusive: false,
        kitchenEnabled: false,
      },
    });
  }
  return venue.id;
}

async function upsertEvent(venueId: string, ev: GoOutEvent): Promise<"created" | "updated" | "skipped"> {
  const existing = await db.event.findFirst({
    where: { source: SOURCE, externalId: ev.externalId },
    select: { id: true, updatedAt: true },
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
    tags: "go-out-import",
    lat: ev.lat,
    lng: ev.lng,
    source: SOURCE,
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
  // Mark past events as ENDED
  await db.event.updateMany({
    where: {
      venueId,
      source: SOURCE,
      status: "PUBLISHED",
      startsAt: { lt: new Date() },
    },
    data: { status: "ENDED" },
  });
}

// POST /api/sync/goout
// Protected by SYNC_SECRET header (or env fallback for cron)
export async function POST(req: NextRequest) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const auth = req.headers.get("x-sync-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const startMs = Date.now();
  const venueId = await ensureVenue();
  const { events, errors } = await scrapeGoOut();

  let created = 0, updated = 0, skipped = 0;
  for (const ev of events) {
    const res = await upsertEvent(venueId, ev);
    if (res === "created") created++;
    else if (res === "updated") updated++;
    else skipped++;
  }

  await expireOldEvents(venueId);

  const elapsed = Date.now() - startMs;
  const stats = { scraped: events.length, created, updated, skipped, errors, elapsed_ms: elapsed };
  console.log("[sync/goout]", JSON.stringify(stats));

  return NextResponse.json({ ok: true, ...stats });
}

// GET for health / last sync info
export async function GET(req: NextRequest) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const auth = req.headers.get("x-sync-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const count = await db.event.count({ where: { source: "go-out", status: "PUBLISHED" } });
  const latest = await db.event.findFirst({
    where: { source: "go-out" },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true, name: true },
  });

  return NextResponse.json({ live_events: count, last_sync: latest?.updatedAt, last_event: latest?.name });
}
