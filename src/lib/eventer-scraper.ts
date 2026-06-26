/**
 * eventer.co.il scraper — Israel's largest event ticketing platform.
 *
 * eventer.co.il is an AngularJS SPA, so there is no server-rendered HTML to
 * parse. It does expose plain-HTTP JSON endpoints that the app itself calls;
 * we crawl three of them to gather as many events as possible:
 *
 *   1. GET /sliders/list.js
 *        Home-page sliders. Event slides (sliderType 1, slideType 5) give us a
 *        seed list of event linkNames + their objectRef (= event _id), plus the
 *        club handles under the "search by club" slider (url /venues/<handle>).
 *   2. GET /Venue/<handle>/byLink.js
 *        A club's full upcoming event list, each event carrying its ticketTypes
 *        and the club's location — so no extra requests are needed per event.
 *   3. GET /user/<handle>/getData?hideExcludedEvents=true&lang=he_IL
 *        A producer's full event list (e.g. "hapark" = The Park Summer House,
 *        northern open-air raves). Prices are fetched per event.
 *   4. GET /events/explainNames/<linkName>.js   (fallback for seed events that
 *        aren't covered by a club/producer crawl) → the full event object.
 *   5. GET /events/<eventId>/ticketTypes.js     (price when not embedded).
 *
 * Schedule times come either as ISO with a zone (…Z) or as naive
 * "YYYY-MM-DD HH:mm" wall-clock in Asia/Jerusalem, which we resolve to UTC
 * (DST-aware) before building Dates.
 */

import {
  type ScrapedEvent,
  BROWSER_HEADERS,
  isIsraeli,
  parseCity,
} from "./scraped-event";

const EVENTER_BASE = "https://www.eventer.co.il";
const MAX_EVENTS = 400;
const CONCURRENCY = 8;

// Producers (eventer "user" pages) we crawl in full — open-air / northern raves
// and other promoters whose events don't always reach the home page.
const PRODUCER_HANDLES = ["hapark"];
// Clubs we always crawl, on top of those discovered from the home-page sliders.
const EXTRA_VENUE_HANDLES: string[] = [];

// "מחוז הצפון" → "הצפון" etc. Used when an event/venue has no city, so the
// resulting location string still matches the region filters on the site.
const REGION_LABEL: Record<string, string> = {
  "מחוז הצפון": "הצפון",
  "מחוז חיפה": "חיפה",
  "מחוז תל אביב": "תל אביב-יפו",
  "מחוז המרכז": "המרכז",
  "מחוז הדרום": "הדרום",
  "מחוז ירושלים": "ירושלים",
  "מחוז יהודה ושומרון": "יהודה ושומרון",
};

interface Slide {
  slideType?: number;
  linkName?: string;
  objectRef?: string;
  url?: string;
}
interface Slider {
  sliderType?: number;
  slides?: Slide[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loc = Record<string, any>;

async function getJson<T>(path: string, timeoutMs = 15_000): Promise<T | null> {
  try {
    const res = await fetch(`${EVENTER_BASE}${path}`, {
      headers: { ...BROWSER_HEADERS, Accept: "application/json, text/plain, */*" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

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

/** Parse a naive "YYYY-MM-DD HH:mm" Israel wall-clock string into a UTC Date. */
function parseIsraelLocal(local: string): Date | null {
  const m = local.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!m) return null;
  const guessUTC = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const off = tzOffsetMinutes("Asia/Jerusalem", new Date(guessUTC));
  const d = new Date(guessUTC - off * 60_000);
  return isNaN(d.getTime()) ? null : d;
}

/** Handle both ISO-with-zone ("…Z"/"+03:00") and naive Israel-local strings. */
function parseSchedule(s: string | undefined | null): Date | null {
  if (!s) return null;
  const str = String(s).trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  return parseIsraelLocal(str);
}

function stripHtml(s: string | undefined | null): string | null {
  if (!s) return null;
  const text = String(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) return null;
  return text.length > 1500 ? text.slice(0, 1500) + "…" : text;
}

function resolveCity(loc: Loc, locDesc: string, fb?: Loc): string {
  const al = loc?.addressLocality || fb?.addressLocality;
  if (al) return String(al);
  const region = loc?.addressRegion || fb?.addressRegion;
  if (region) return REGION_LABEL[region] || String(region);
  return parseCity(locDesc || "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function minTicketPriceAgorot(ticketTypes: any): number {
  if (!Array.isArray(ticketTypes)) return 0;
  const prices = ticketTypes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((t: any) => Number(t?.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.round(Math.min(...prices) * 100) : 0;
}

interface Fallback {
  loc?: Loc;
  locDesc?: string;
  image?: string | null;
}

/** Normalize a raw eventer event object (any source) into a ScrapedEvent. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function normalize(ev: any, fb: Fallback | null, now: number): Promise<ScrapedEvent | null> {
  if (!ev || !ev._id) return null;
  if (ev.status !== 1 && ev.status !== undefined) return null;

  const title = String(ev.name ?? "").trim();
  if (!title) return null;

  const startsAt = parseSchedule(ev.schedule?.start);
  if (!startsAt) return null;
  if (startsAt.getTime() < now - 6 * 3600_000) return null;
  const endsAt = parseSchedule(ev.schedule?.end);

  const loc: Loc = ev.location ?? {};
  const country = loc.addressCountry || fb?.loc?.addressCountry;
  if (country && String(country).toUpperCase() !== "IL") return null;

  const locDesc = String(ev.locationDescription ?? "") || fb?.locDesc || "";
  const city = resolveCity(loc, locDesc, fb?.loc);
  const address = locDesc || city;
  if (!isIsraeli(`${address} ${city}`)) return null;

  const images = (ev.ticketPlatform?.images ?? {}) as Record<string, string>;
  const imageUrl =
    images.imageDefault ||
    images.imageWide ||
    images.imageSquare ||
    (typeof ev.background === "string" ? ev.background : null) ||
    fb?.image ||
    null;

  let minPriceAgorot = 0;
  if (Array.isArray(ev.ticketTypes)) {
    minPriceAgorot = minTicketPriceAgorot(ev.ticketTypes);
  } else {
    const tt = await getJson<{ ticketTypes?: unknown }>(`/events/${ev._id}/ticketTypes.js`);
    if (tt?.ticketTypes) minPriceAgorot = minTicketPriceAgorot(tt.ticketTypes);
  }

  const lat =
    typeof loc.latitude === "number" ? loc.latitude
    : typeof fb?.loc?.latitude === "number" ? fb.loc.latitude
    : null;
  const lng =
    typeof loc.longitude === "number" ? loc.longitude
    : typeof fb?.loc?.longitude === "number" ? fb.loc.longitude
    : null;

  const linkName = String(ev.linkName ?? "");
  const externalUrl = linkName.includes("/")
    ? `${EVENTER_BASE}/${linkName}`
    : `${EVENTER_BASE}/events/${linkName || ev._id}`;

  return {
    externalId: String(ev._id),
    externalUrl,
    title,
    description: stripHtml(ev.eventDesc),
    startsAt,
    endsAt,
    address,
    city,
    lat,
    lng,
    imageUrl,
    genres: "",
    minPriceAgorot,
    eventType: "מועדוני לילה",
  };
}

/** Run an async mapper over items with bounded concurrency. */
async function mapLimit<I>(items: I[], limit: number, fn: (item: I) => Promise<void>): Promise<void> {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 1 }, worker));
}

export async function scrapeEventer(): Promise<{ events: ScrapedEvent[]; errors: string[] }> {
  const errors: string[] = [];
  const now = Date.now();

  // 1) Home-page sliders → seed events (+ their _id) and club handles.
  const seeds: { link: string; id?: string }[] = [];
  const venueHandles = new Set<string>(EXTRA_VENUE_HANDLES);
  const sliders = await getJson<Slider[]>("/sliders/list.js");
  if (Array.isArray(sliders)) {
    const seen = new Set<string>();
    for (const slider of sliders) {
      for (const slide of slider.slides ?? []) {
        const u = (slide.url ?? "").split("?")[0];
        if (slide.slideType === 5 && slide.linkName && /^\/[^/]+$/.test(u) && !u.startsWith("/tickets")) {
          if (!seen.has(slide.linkName)) {
            seen.add(slide.linkName);
            seeds.push({ link: slide.linkName, id: slide.objectRef });
          }
        }
        const vm = u.match(/^\/venues\/([^/]+)$/);
        if (vm) venueHandles.add(vm[1]);
      }
    }
  } else {
    errors.push("sliders fetch failed");
  }

  const byId = new Map<string, ScrapedEvent>();
  const add = (ev: ScrapedEvent | null) => {
    if (ev && !byId.has(ev.externalId)) byId.set(ev.externalId, ev);
  };

  // 2) Clubs — full event lists with embedded prices + location.
  await mapLimit([...venueHandles], 4, async (h) => {
    const v = await getJson<{ events?: unknown[]; location?: Loc; locationDescription?: string; images?: Record<string, string> }>(
      `/Venue/${encodeURIComponent(h)}/byLink.js`,
    );
    if (!v || !Array.isArray(v.events)) return;
    const fb: Fallback = { loc: v.location, locDesc: v.locationDescription, image: v.images?.imageDefault ?? null };
    for (const ev of v.events) {
      try {
        add(await normalize(ev, fb, now));
      } catch (err) {
        errors.push(`venue ${h}: ${(err as Error).message}`);
      }
    }
  });

  // 3) Producers — full event lists (prices fetched per event).
  await mapLimit(PRODUCER_HANDLES, 4, async (h) => {
    const p = await getJson<{ events?: unknown[]; location?: Loc; locationDescription?: string }>(
      `/user/${encodeURIComponent(h)}/getData?hideExcludedEvents=true&lang=he_IL`,
    );
    if (!p || !Array.isArray(p.events)) return;
    const fb: Fallback = { loc: p.location, locDesc: p.locationDescription };
    for (const ev of p.events) {
      try {
        add(await normalize(ev, fb, now));
      } catch (err) {
        errors.push(`producer ${h}: ${(err as Error).message}`);
      }
    }
  });

  // 4) Seed events not already covered by a club/producer crawl → explainNames.
  const remaining = seeds.filter((s) => !(s.id && byId.has(s.id)));
  await mapLimit(remaining, CONCURRENCY, async (s) => {
    try {
      const d = await getJson<{ event?: unknown }>(
        `/events/explainNames/${encodeURIComponent(s.link)}.js`,
      );
      if (d?.event) add(await normalize(d.event, null, now));
    } catch (err) {
      errors.push(`event ${s.link}: ${(err as Error).message}`);
    }
  });

  // Final title|day dedup (a party can sit in several lists with different ids).
  const out: ScrapedEvent[] = [];
  const byTitleDay = new Set<string>();
  for (const ev of byId.values()) {
    const k = `${ev.title.toLowerCase()}|${ev.startsAt.toISOString().slice(0, 10)}`;
    if (byTitleDay.has(k)) continue;
    byTitleDay.add(k);
    out.push(ev);
    if (out.length >= MAX_EVENTS) break;
  }

  console.log(
    `[eventer] venues=${venueHandles.size} producers=${PRODUCER_HANDLES.length} seeds=${seeds.length} → ${out.length} events`,
  );
  return { events: out, errors };
}
