/**
 * Resident Advisor (ra.co) scraper — global electronic-music platform with an
 * Israel scene concentrated in the "Tel Aviv" area (RA's only Israeli area,
 * id 413, which in practice covers club nights and open-airs across the
 * country). RA renders listings client-side via a public GraphQL endpoint
 * (POST https://ra.co/graphql, operation GET_EVENT_LISTINGS), so we call it
 * directly and page through the upcoming window.
 *
 * Each listing carries the event title, naive Israel wall-clock start/end
 * times, the flyer image, the venue (+ area/country), and the full artist
 * lineup — high-signal techno/house events that also feed the in-app
 * "virtual venue" artist player.
 */

import { type ScrapedEvent, parseCity } from "./scraped-event";

const RA_BASE = "https://ra.co";
const RA_GRAPHQL = `${RA_BASE}/graphql`;
// RA area 413 = Tel Aviv (the only Israeli area on RA).
const RA_AREAS = [413];
const PAGE_SIZE = 50;
const MAX_PAGES = 6;
const WINDOW_DAYS = 180;

const RA_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "ra-content-language": "en",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Referer: `${RA_BASE}/events/il/telaviv`,
  Origin: RA_BASE,
};

const GET_EVENT_LISTINGS = `query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $pageSize: Int, $page: Int, $sort: SortInputDtoInput) {
  eventListings(filters: $filters, pageSize: $pageSize, page: $page, sort: $sort) {
    data {
      id
      event {
        id
        title
        date
        startTime
        endTime
        contentUrl
        flyerFront
        images { filename type }
        venue { id name contentUrl address area { id name country { name urlCode } } }
        artists { name }
      }
    }
    totalResults
  }
}`;

// "Tel Aviv" (RA area name) → site-friendly Hebrew city token.
const AREA_LABEL: Record<string, string> = {
  "Tel Aviv": "תל אביב-יפו",
  Jerusalem: "ירושלים",
  Haifa: "חיפה",
  Eilat: "אילת",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RaEvent = Record<string, any>;

/** Minutes east of UTC for a timezone at a given instant (DST-aware). */
function tzOffsetMinutes(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((a, p) => {
    a[p.type] = p.value;
    return a;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "0" : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUTC - date.getTime()) / 60_000);
}

/**
 * RA's startTime/endTime are naive Israel wall-clock strings
 * ("2026-06-27T10:00:00.000"). Resolve them to UTC (DST-aware). Strings that
 * already carry a zone are parsed as-is.
 */
function parseRaTime(s: string | undefined | null): Date | null {
  if (!s) return null;
  const str = String(s).trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = str.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!m) return null;
  const guessUTC = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const off = tzOffsetMinutes("Asia/Jerusalem", new Date(guessUTC));
  const d = new Date(guessUTC - off * 60_000);
  return isNaN(d.getTime()) ? null : d;
}

function pickImage(ev: RaEvent): string | null {
  if (ev.flyerFront) return String(ev.flyerFront);
  const imgs = Array.isArray(ev.images) ? ev.images : [];
  const flyer = imgs.find((i: RaEvent) => i?.type === "FLYERFRONT" && i?.filename);
  if (flyer) return String(flyer.filename);
  const first = imgs.find((i: RaEvent) => i?.filename);
  return first ? String(first.filename) : null;
}

function normalize(ev: RaEvent): ScrapedEvent | null {
  const id = ev?.id ? String(ev.id) : null;
  const title = (ev?.title ? String(ev.title) : "").trim();
  if (!id || !title) return null;

  const startsAt = parseRaTime(ev.startTime || ev.date);
  if (!startsAt) return null;
  const endsAt = parseRaTime(ev.endTime);

  const venue = (ev.venue || {}) as RaEvent;
  const area = (venue.area || {}) as RaEvent;
  const country = (area.country || {}) as RaEvent;
  // Keep Israel only (RA area 413 is Israeli, but guard against odd data).
  if (country.urlCode && String(country.urlCode).toUpperCase() !== "IL") return null;

  const areaName = area.name ? String(area.name) : "";
  const city = AREA_LABEL[areaName] || parseCity(venue.address || areaName || "");
  const addressParts = [venue.name, venue.address, areaName].filter(Boolean).map(String);

  const artists = Array.isArray(ev.artists)
    ? ev.artists.map((a: RaEvent) => a?.name).filter(Boolean).map(String)
    : [];
  // RA is an electronic-music platform; tag accordingly and append the lineup
  // so the in-app artist player / search can surface DJs.
  const lineup = artists.slice(0, 8).join(", ");
  const description = lineup ? `Lineup: ${lineup}` : null;

  const contentUrl = ev.contentUrl ? String(ev.contentUrl) : `/events/${id}`;

  return {
    externalId: id,
    externalUrl: contentUrl.startsWith("http") ? contentUrl : `${RA_BASE}${contentUrl}`,
    title,
    description,
    startsAt,
    endsAt: endsAt && endsAt.getTime() > startsAt.getTime() ? endsAt : null,
    address: addressParts.join(", ") || areaName || "Israel",
    city: city || areaName || "תל אביב-יפו",
    lat: null,
    lng: null,
    imageUrl: pickImage(ev),
    genres: "electronic",
    minPriceAgorot: 0,
    eventType: "מועדוני לילה",
  };
}

async function fetchPage(areaId: number, page: number, gte: string, lte: string): Promise<RaEvent[]> {
  const body = JSON.stringify({
    operationName: "GET_EVENT_LISTINGS",
    query: GET_EVENT_LISTINGS,
    variables: {
      filters: { areas: { eq: areaId }, listingDate: { gte, lte } },
      pageSize: PAGE_SIZE,
      page,
      sort: { listingDate: { order: "ASCENDING" } },
    },
  });
  const res = await fetch(RA_GRAPHQL, {
    method: "POST",
    headers: RA_HEADERS,
    body,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`graphql ${res.status}`);
  const json = (await res.json()) as RaEvent;
  if (json?.errors) throw new Error(`graphql errors: ${JSON.stringify(json.errors).slice(0, 200)}`);
  const data = json?.data?.eventListings?.data;
  return Array.isArray(data) ? data : [];
}

export async function scrapeRa(): Promise<{ events: ScrapedEvent[]; errors: string[] }> {
  const all = new Map<string, ScrapedEvent>();
  const byTitleDay = new Set<string>();
  const errors: string[] = [];
  const now = Date.now();
  const gte = new Date(now).toISOString().slice(0, 10) + "T00:00:00.000Z";
  const lte = new Date(now + WINDOW_DAYS * 864e5).toISOString().slice(0, 10) + "T00:00:00.000Z";

  for (const areaId of RA_AREAS) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      let rows: RaEvent[];
      try {
        rows = await fetchPage(areaId, page, gte, lte);
      } catch (err) {
        errors.push(`area ${areaId} p${page}: ${(err as Error).message}`);
        break;
      }
      if (!rows.length) break;
      for (const row of rows) {
        const ev = normalize(row?.event || {});
        if (!ev) continue;
        if (ev.startsAt.getTime() < now - 6 * 3600_000) continue; // skip past
        const dayKey = `${ev.title.toLowerCase()}|${ev.startsAt.toISOString().slice(0, 10)}`;
        if (all.has(ev.externalId) || byTitleDay.has(dayKey)) continue;
        all.set(ev.externalId, ev);
        byTitleDay.add(dayKey);
      }
      console.log(`[ra] area ${areaId} page ${page} → ${rows.length} rows`);
      if (rows.length < PAGE_SIZE) break;
    }
  }

  return { events: Array.from(all.values()), errors };
}
