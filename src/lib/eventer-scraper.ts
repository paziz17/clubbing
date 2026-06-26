/**
 * eventer.co.il scraper — Israel's largest event ticketing platform.
 *
 * eventer.co.il is an AngularJS SPA, so there is no server-rendered HTML or
 * __NEXT_DATA__ to parse. It does expose plain-HTTP JSON endpoints that the app
 * itself calls:
 *
 *   1. GET /sliders/list.js
 *        → the home-page sliders. Event slides live in `sliderType === 1`
 *          sliders, each slide having { slideType: 5, linkName, url, title,
 *          subTitle }. We collect every unique event `linkName`.
 *   2. GET /events/explainNames/<linkName>.js
 *        → the full event object: { event: { name, status, schedule.start/end,
 *          location {latitude, longitude, addressLocality, streetAddress},
 *          locationDescription, eventDesc, ticketPlatform.images } }.
 *   3. GET /events/<eventId>/ticketTypes.js
 *        → ticket types with `price` (ILS); we take the cheapest available one.
 *
 * Schedule times come as naive "YYYY-MM-DD HH:mm" wall-clock in Asia/Jerusalem,
 * so we resolve the correct UTC offset (handles IST/IDT) before building Dates.
 */

import {
  type ScrapedEvent,
  BROWSER_HEADERS,
  isIsraeli,
  parseCity,
} from "./scraped-event";

const EVENTER_BASE = "https://www.eventer.co.il";
// Cap how many events we resolve per run to keep the sync fast and polite.
const MAX_EVENTS = 250;
// Concurrency for the per-event detail fetches.
const CONCURRENCY = 8;

interface Slide {
  slideType?: number;
  linkName?: string;
  url?: string;
  title?: string;
  subTitle?: string;
}
interface Slider {
  sliderType?: number;
  slides?: Slide[];
}

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
function parseIsraelLocal(local: string | undefined | null): Date | null {
  if (!local) return null;
  const m = String(local).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!m) return null;
  const guessUTC = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const off = tzOffsetMinutes("Asia/Jerusalem", new Date(guessUTC));
  const d = new Date(guessUTC - off * 60_000);
  return isNaN(d.getTime()) ? null : d;
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

/** Collect every unique event linkName from the home-page sliders. */
async function collectLinkNames(): Promise<string[]> {
  const sliders = await getJson<Slider[]>("/sliders/list.js");
  if (!Array.isArray(sliders)) return [];
  const seen = new Set<string>();
  for (const slider of sliders) {
    if (slider?.sliderType !== 1) continue;
    for (const slide of slider.slides ?? []) {
      // slideType 5 = event slide; url like "/<linkName>" (skip /tickets/... links).
      const url = slide?.url ?? "";
      const link = slide?.linkName;
      if (slide?.slideType !== 5 || !link) continue;
      if (url.startsWith("/tickets") || !/^\/[^/]+$/.test(url)) continue;
      if (!seen.has(link)) seen.add(link);
      if (seen.size >= MAX_EVENTS) return Array.from(seen);
    }
  }
  return Array.from(seen);
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

async function resolveEvent(linkName: string, now: number): Promise<ScrapedEvent | null> {
  const data = await getJson<{ event?: Record<string, unknown> }>(
    `/events/explainNames/${encodeURIComponent(linkName)}.js`,
  );
  const ev = data?.event as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!ev || !ev._id) return null;

  // status 1 = live/published. Anything else (draft, archived) is skipped.
  if (ev.status !== 1 && ev.status !== undefined) return null;

  const title = String(ev.name ?? "").trim();
  if (!title) return null;

  const startsAt = parseIsraelLocal(ev.schedule?.start);
  if (!startsAt) return null;
  // Skip clearly-past events (allow up to 6h after start for ongoing nights).
  if (startsAt.getTime() < now - 6 * 3600_000) return null;
  const endsAt = parseIsraelLocal(ev.schedule?.end);

  const loc = (ev.location ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const address =
    String(ev.locationDescription ?? "") ||
    [loc.streetAddress, loc.addressLocality].filter(Boolean).join(", ");
  const city = String(loc.addressLocality ?? "") || parseCity(address);

  // Foreign events occasionally appear (Eventer also sells abroad) — drop them.
  if (loc.addressCountry && String(loc.addressCountry).toUpperCase() !== "IL") {
    return null;
  }
  if (!isIsraeli(`${address} ${city}`)) return null;

  const images = (ev.ticketPlatform?.images ?? {}) as Record<string, string>;
  const imageUrl =
    images.imageDefault ||
    images.imageWide ||
    images.imageSquare ||
    (typeof ev.background === "string" ? ev.background : null) ||
    (typeof ev.thumbnail === "string" ? ev.thumbnail : null) ||
    null;

  // Ticket price (cheapest available). Best-effort — events with no public
  // pricing just report 0, exactly like the other scrapers.
  let minPriceAgorot = 0;
  const tt = await getJson<{ ticketTypes?: unknown }>(`/events/${ev._id}/ticketTypes.js`);
  if (tt?.ticketTypes) minPriceAgorot = minTicketPriceAgorot(tt.ticketTypes);

  const lat = typeof loc.latitude === "number" ? loc.latitude : null;
  const lng = typeof loc.longitude === "number" ? loc.longitude : null;

  return {
    externalId: linkName,
    externalUrl: `${EVENTER_BASE}/events/${linkName}`,
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
async function mapLimit<I, O>(
  items: I[],
  limit: number,
  fn: (item: I) => Promise<O>,
): Promise<O[]> {
  const out: O[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function scrapeEventer(): Promise<{ events: ScrapedEvent[]; errors: string[] }> {
  const errors: string[] = [];
  const now = Date.now();

  let linkNames: string[] = [];
  try {
    linkNames = await collectLinkNames();
  } catch (err) {
    errors.push(`sliders: ${(err as Error).message}`);
  }
  if (!linkNames.length) {
    errors.push("no event slides found in /sliders/list.js");
    return { events: [], errors };
  }

  const resolved = await mapLimit(linkNames, CONCURRENCY, async (link) => {
    try {
      return await resolveEvent(link, now);
    } catch (err) {
      errors.push(`event ${link}: ${(err as Error).message}`);
      return null;
    }
  });

  // Dedupe by externalId and by title|day (a party can sit in several sliders).
  const all = new Map<string, ScrapedEvent>();
  const byTitleDay = new Set<string>();
  for (const ev of resolved) {
    if (!ev) continue;
    const dayKey = `${ev.title.toLowerCase()}|${ev.startsAt.toISOString().slice(0, 10)}`;
    if (all.has(ev.externalId) || byTitleDay.has(dayKey)) continue;
    all.set(ev.externalId, ev);
    byTitleDay.add(dayKey);
  }

  console.log(`[eventer] ${linkNames.length} links → ${all.size} events`);
  return { events: Array.from(all.values()), errors };
}
