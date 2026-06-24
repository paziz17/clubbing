/**
 * zygo.co.il scraper — Israeli nightlife/party ticketing platform.
 *
 * Strategy: parse __NEXT_DATA__ from several listing pages. Each page exposes
 * pageProps.mainCaruselEvents / secenderyCaruselEvents arrays with the shape:
 *   { id, title, location:{address,lat,lng}, startDate, identifier, image,
 *     description, creator, tickets:[…] }
 */

import {
  type ScrapedEvent,
  BROWSER_HEADERS,
  isIsraeli,
  parseCity,
  extractNextData,
} from "./scraped-event";

const ZYGO_BASE = "https://zygo.co.il";
// Valid routes as of 2026-06: the homepage exposes the carousels, while the
// city/weekend pages expose a flat `events` array. The old per-city slugs
// (/jerusalem, /haifa, /south …) now 404, so they were removed.
const SCRAPE_PAGES = ["/", "/tel-aviv", "/weekend", "/today"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function minTicketPriceAgorot(tickets: any): number {
  if (!Array.isArray(tickets) || tickets.length === 0) return 0;
  const prices = tickets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((t: any) => Number(t?.price ?? t?.Price ?? t?.amount ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return 0;
  return Math.round(Math.min(...prices) * 100);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(ev: Record<string, any>): ScrapedEvent | null {
  const id = (ev["id"] || ev["identifier"]) as string;
  const title = ((ev["title"] as string) || "").trim();
  if (!id || !title) return null;

  const startsAt = new Date(ev["startDate"] as string);
  if (isNaN(startsAt.getTime())) return null;

  // `location` is either a plain address string (city/weekend pages) or an
  // object { address, lat, lng } (homepage carousel). Handle both shapes.
  const locRaw = ev["location"];
  let addr = "";
  let lat: number | null = null;
  let lng: number | null = null;
  if (typeof locRaw === "string") {
    addr = locRaw;
  } else if (locRaw && typeof locRaw === "object") {
    const lo = locRaw as { address?: string; lat?: number; lng?: number };
    addr = lo.address || "";
    lat = typeof lo.lat === "number" ? lo.lat : null;
    lng = typeof lo.lng === "number" ? lo.lng : null;
  }
  if (!isIsraeli(addr)) return null;

  return {
    externalId: id,
    externalUrl: `${ZYGO_BASE}/e/${ev["identifier"] || id}`,
    title,
    description: (ev["description"] as string) || null,
    startsAt,
    endsAt: null,
    address: addr,
    city: parseCity(addr),
    lat,
    lng,
    imageUrl: (ev["image"] as string) || null,
    genres: "",
    minPriceAgorot: minTicketPriceAgorot(ev["tickets"]),
    eventType: "מועדוני לילה",
  };
}

async function scrapePage(path: string): Promise<ScrapedEvent[]> {
  const url = `${ZYGO_BASE}${path}`;
  let html: string;
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(20_000) });
    html = await res.text();
  } catch {
    console.warn(`[zygo] fetch failed for ${url}`);
    return [];
  }

  const data = extractNextData(html);
  if (!data) return [];
  const pageProps =
    (data as { props?: { pageProps?: Record<string, unknown> } })?.props?.pageProps ?? {};

  const out: ScrapedEvent[] = [];
  const seen = new Set<string>();
  const collect = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    for (const raw of arr as Record<string, unknown>[]) {
      const ev = normalize(raw);
      if (ev && !seen.has(ev.externalId)) {
        seen.add(ev.externalId);
        out.push(ev);
      }
    }
  };
  collect(pageProps["mainCaruselEvents"]);
  collect(pageProps["secenderyCaruselEvents"]);
  // City/weekend pages expose a flat `events` array (same event shape).
  collect(pageProps["events"]);
  return out;
}

export async function scrapeZygo(): Promise<{ events: ScrapedEvent[]; errors: string[] }> {
  const all = new Map<string, ScrapedEvent>();
  const byTitleDay = new Set<string>();
  const errors: string[] = [];
  const now = Date.now();

  for (const path of SCRAPE_PAGES) {
    try {
      const events = await scrapePage(path);
      for (const ev of events) {
        if (ev.startsAt.getTime() < now - 6 * 3600_000) continue; // skip clearly past
        const dayKey = `${ev.title.toLowerCase()}|${ev.startsAt.toISOString().slice(0, 10)}`;
        if (all.has(ev.externalId) || byTitleDay.has(dayKey)) continue;
        all.set(ev.externalId, ev);
        byTitleDay.add(dayKey);
      }
      console.log(`[zygo] ${path} → ${events.length} events`);
    } catch (err) {
      const msg = `scrape ${path}: ${(err as Error).message}`;
      errors.push(msg);
      console.error("[zygo]", msg);
    }
  }

  return { events: Array.from(all.values()), errors };
}
