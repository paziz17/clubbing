/**
 * go-out.co scraper — fetches Israeli party/nightlife events from all regions.
 *
 * Strategy: parse __NEXT_DATA__ from the homepage. The homepage payload holds
 * three distinct event collections, each with a different shape:
 *   - homePageData.firstEvents       (full shape: _id, Url, Title, Adress, MusicType…)
 *   - homePageData.nextWeek.events   (same full shape)
 *   - homePageData.spotLight.Events  (compact shape: link, title, Address, url…)
 * spotLight is the geographically diverse set (Tel Aviv, Haifa, Jerusalem,
 * Eilat, Kinneret, Herzliya…), so it is the main source of country-wide events.
 *
 * No external deps — plain fetch with browser-like headers.
 */

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
};

const GOOUT_BASE = "https://go-out.co";

// Pages to scrape. As of 2026-06 the category routes (/nightlife, /concerts,
// /festivals, /sports) all 404; only the homepage still ships a homePageData
// payload, and its spotLight set already spans the whole country.
const SCRAPE_PAGES = ["/"];

export interface GoOutEvent {
  externalId: string;
  externalUrl: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
  genres: string;
  minPriceAgorot: number;
  eventType: string;
}

// ------- helpers -------

function buildImageUrl(id: string, ts: number | undefined): string | null {
  if (!id || !ts) return null;
  // The asset path requires the /events/ prefix; without it the CDN returns 403.
  return `https://images.go-out.co/events/${id}${ts}_coverImage.jpg`;
}

// Markers that mean the event is NOT in Israel (go-out also lists events abroad).
const FOREIGN_MARKERS = [
  "greece",
  "יוון",
  "athens",
  "cyprus",
  "קפריסין",
  "portugal",
  "spain",
  "ספרד",
  "italy",
  "איטליה",
  "germany",
  "גרמניה",
  "thailand",
  "georgia",
  "גאורגיה",
  "egaleo",
  "marousi",
];

function isIsraeli(addr: string): boolean {
  if (!addr) return false;
  const lower = addr.toLowerCase();
  if (FOREIGN_MARKERS.some((m) => lower.includes(m))) return false;
  if (addr.includes("ישראל") || lower.includes("israel")) return true;
  // Fallback: well-known Israeli city tokens for addresses missing a country.
  const cities = [
    "tel aviv",
    "תל אביב",
    "jerusalem",
    "ירושלים",
    "haifa",
    "חיפה",
    "eilat",
    "אילת",
    "herzliya",
    "הרצליה",
    "kinneret",
    "כינרת",
    "rishon",
    "ראשון",
    "netanya",
    "נתניה",
    "beer sheva",
    "באר שבע",
    "ramat",
    "רמת",
  ];
  return cities.some((c) => lower.includes(c));
}

function parseCity(addr: string): string {
  // "Rothschild Blvd 19, Tel Aviv-Yafo, 6688122, Israel" → "Tel Aviv-Yafo"
  const parts = addr.split(",").map((s) => s.trim());
  const noCountry = parts.filter(
    (p) => p && !/^israel$/i.test(p) && p !== "ישראל",
  );
  if (noCountry.length >= 2) {
    return noCountry[1].replace(/\d+/g, "").trim() || noCountry[0];
  }
  return noCountry[0] || addr;
}

const MUSIC_TYPE_MAP: Record<string, string> = {
  מיינסטרים: "mainstream",
  טכנו: "techno",
  "היפ הופ": "hiphop",
  "אר אנד בי": "rnb",
  "פופ אלקטרוני": "electronic",
  "מוזיקה אלקטרונית": "electronic",
  ממי: "house",
  האוס: "house",
  טראנס: "trance",
  רגאיי: "reggae",
  "מזרחי-מדיטרני": "mizrahi",
  ישראלי: "israeli",
  "קלאסיק רוק": "rock",
  "ג'אז": "jazz",
  אחר: "",
};

function mapGenres(musicTypes: (string | null)[]): string {
  if (!Array.isArray(musicTypes)) return "";
  return musicTypes
    .filter(Boolean)
    .map((t) => MUSIC_TYPE_MAP[t as string] ?? "")
    .filter(Boolean)
    .join(",");
}

function extractNextData(html: string): Record<string, unknown> | null {
  const idx = html.indexOf('id="__NEXT_DATA__"');
  if (idx === -1) return null;
  const start = html.indexOf(">", idx) + 1;
  const end = html.indexOf("</script>", start);
  if (start <= 0 || end <= 0) return null;
  try {
    return JSON.parse(html.slice(start, end));
  } catch {
    return null;
  }
}

/** Full-shape events: homePageData.firstEvents / nextWeek.events */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFull(ev: Record<string, any>): GoOutEvent | null {
  const id = ev["_id"] as string;
  const urlId = ev["Url"] as string;
  if (!id || !urlId) return null;

  const startsAt = new Date(ev["StartingDate"] as string);
  if (isNaN(startsAt.getTime())) return null;

  const addr = (ev["EnglishAddress"] || ev["Adress"] || "") as string;
  if (!isIsraeli(addr)) return null;

  const endsAt = ev["EndingDate"] ? new Date(ev["EndingDate"] as string) : null;
  const ts = ev["CoverImageTimestamp"] as number | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets: any[] = Array.isArray(ev["Tickets"]) ? ev["Tickets"] : [];
  const minPrice = tickets.length
    ? Math.min(...tickets.filter((t) => t.Active).map((t) => t.Price ?? 0))
    : 0;

  return {
    externalId: urlId,
    externalUrl: `${GOOUT_BASE}/event/${urlId}`,
    title: ((ev["Title"] as string) || "").trim(),
    description: (ev["Description"] as string) || null,
    startsAt,
    endsAt: endsAt && !isNaN(endsAt.getTime()) ? endsAt : null,
    address: addr,
    city: parseCity(addr),
    lat: (ev["Location"] as { lat?: number })?.lat ?? null,
    lng: (ev["Location"] as { lng?: number })?.lng ?? null,
    imageUrl: buildImageUrl(id, ts),
    genres: mapGenres(ev["MusicType"] as string[]),
    minPriceAgorot: Math.round(minPrice * 100),
    eventType: (ev["EventType"] || ev["eventType"] || "מועדוני לילה") as string,
  };
}

/** Compact-shape events: homePageData.spotLight.Events (country-wide set) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSpotlight(ev: Record<string, any>): GoOutEvent | null {
  const link = ev["link"] as string;
  if (!link) return null;

  const startsAt = new Date(ev["StartingDate"] as string);
  if (isNaN(startsAt.getTime())) return null;

  const addr = (ev["Address"] || ev["EnglishAddress"] || ev["Adress"] || "") as string;
  if (!isIsraeli(addr)) return null;

  return {
    externalId: link,
    externalUrl: `${GOOUT_BASE}/event/${link}`,
    title: ((ev["title"] as string) || (ev["Title"] as string) || "").trim(),
    description: null,
    startsAt,
    endsAt: null,
    address: addr,
    city: parseCity(addr),
    lat: null,
    lng: null,
    imageUrl: (ev["url"] as string) || (ev["thumbnail"] as string) || null,
    genres: "",
    minPriceAgorot: 0,
    eventType: "מועדוני לילה",
  };
}

// ------- core scraper -------

async function scrapePage(path: string): Promise<GoOutEvent[]> {
  const url = `${GOOUT_BASE}${path}`;
  let html: string;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    html = await res.text();
  } catch {
    console.warn(`[goout] fetch failed for ${url}`);
    return [];
  }

  const data = extractNextData(html);
  if (!data) return [];

  const pageProps = (data as { props?: { pageProps?: Record<string, unknown> } })
    ?.props?.pageProps ?? {};
  const hpd = pageProps["homePageData"] as Record<string, unknown> | undefined;

  const seen = new Set<string>();
  const result: GoOutEvent[] = [];
  const push = (ev: GoOutEvent | null) => {
    if (ev && ev.title && !seen.has(ev.externalId)) {
      seen.add(ev.externalId);
      result.push(ev);
    }
  };

  if (hpd && typeof hpd === "object") {
    // Full-shape collections.
    if (Array.isArray(hpd["firstEvents"])) {
      for (const raw of hpd["firstEvents"] as Record<string, unknown>[]) {
        push(normalizeFull(raw));
      }
    }
    const nextWeek = hpd["nextWeek"] as { events?: unknown } | undefined;
    if (nextWeek && Array.isArray(nextWeek.events)) {
      for (const raw of nextWeek.events as Record<string, unknown>[]) {
        push(normalizeFull(raw));
      }
    }
    // Compact spotLight collection — the diverse, country-wide set.
    const spotLight = hpd["spotLight"] as { Events?: unknown } | undefined;
    if (spotLight && Array.isArray(spotLight.Events)) {
      for (const raw of spotLight.Events as Record<string, unknown>[]) {
        push(normalizeSpotlight(raw));
      }
    }
  }

  return result;
}

export async function scrapeGoOut(): Promise<{
  events: GoOutEvent[];
  errors: string[];
}> {
  const allEvents = new Map<string, GoOutEvent>();
  // Secondary dedup across collections/pages: same title + day can appear with
  // both a numeric Url and a slug link.
  const byTitleDay = new Set<string>();
  const errors: string[] = [];

  for (const path of SCRAPE_PAGES) {
    try {
      const events = await scrapePage(path);
      for (const ev of events) {
        const dayKey = `${ev.title.toLowerCase()}|${ev.startsAt.toISOString().slice(0, 10)}`;
        if (allEvents.has(ev.externalId) || byTitleDay.has(dayKey)) continue;
        allEvents.set(ev.externalId, ev);
        byTitleDay.add(dayKey);
      }
      console.log(`[goout] ${path} → ${events.length} events`);
    } catch (err) {
      const msg = `scrape ${path}: ${(err as Error).message}`;
      errors.push(msg);
      console.error("[goout]", msg);
    }
  }

  return { events: Array.from(allEvents.values()), errors };
}
