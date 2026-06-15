/**
 * go-out.co scraper — fetches Israeli party/nightlife events.
 *
 * Strategy: parse __NEXT_DATA__ from the homepage + category pages.
 * No external deps needed — plain fetch with browser-like headers.
 * Image URL formula: https://images.go-out.co/{_id}{CoverImageTimestamp}_coverImage.jpg
 */

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
};

const GOOUT_BASE = "https://go-out.co";

// Pages to scrape — each yields its own set of events
const SCRAPE_PAGES = ["/", "/nightlife", "/concerts", "/festivals"];

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
  return `https://images.go-out.co/${id}${ts}_coverImage.jpg`;
}

function parseCity(addr: string): string {
  // "Rothschild Blvd 19, Tel Aviv-Yafo, 6688122, Israel"
  const parts = addr.split(",").map((s) => s.trim());
  if (parts.length >= 2) return parts[1].replace(/\d+/g, "").trim() || parts[0];
  return addr;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEvent(ev: Record<string, any>): GoOutEvent | null {
  const id = ev["_id"] as string;
  const urlId = ev["Url"] as string;
  if (!id || !urlId) return null;

  const startsAt = new Date(ev["StartingDate"] as string);
  if (isNaN(startsAt.getTime())) return null;

  // Only import Israeli events
  const addr = (ev["EnglishAddress"] || ev["Adress"] || "") as string;
  if (!addr.toLowerCase().includes("israel") && !addr.toLowerCase().includes("tel aviv") &&
      !addr.toLowerCase().includes("jerusalem") && !addr.toLowerCase().includes("haifa")) {
    return null;
  }

  const endsAt = ev["EndingDate"] ? new Date(ev["EndingDate"] as string) : null;
  const ts = ev["CoverImageTimestamp"] as number | undefined;

  // Price from ticket list or 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets: any[] = Array.isArray(ev["Tickets"]) ? ev["Tickets"] : [];
  const minPrice = tickets.length
    ? Math.min(...tickets.filter((t) => t.Active).map((t) => (t.Price ?? 0)))
    : 0;

  return {
    externalId: urlId,
    externalUrl: `${GOOUT_BASE}/event/${urlId}`,
    title: (ev["Title"] as string) || "",
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

// ------- core scraper -------

async function scrapePage(path: string): Promise<GoOutEvent[]> {
  const url = `${GOOUT_BASE}${path}`;
  let html: string;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
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
  const rawEvents: Record<string, unknown>[] = [];

  if (hpd && typeof hpd === "object") {
    for (const key of ["firstEvents", "nextWeek", "spotlightEvents", "todayEvents", "weekendEvents"]) {
      const arr = hpd[key];
      if (Array.isArray(arr)) {
        rawEvents.push(...(arr as Record<string, unknown>[]));
      }
    }
    // spotLight can be a dict or array
    const sl = hpd["spotLight"];
    if (Array.isArray(sl)) rawEvents.push(...(sl as Record<string, unknown>[]));
  }

  // Some pages return events directly in pageProps
  for (const key of ["events", "eventList", "data"]) {
    const arr = pageProps[key];
    if (Array.isArray(arr)) rawEvents.push(...(arr as Record<string, unknown>[]));
  }

  const seen = new Set<string>();
  const result: GoOutEvent[] = [];
  for (const raw of rawEvents) {
    const ev = normalizeEvent(raw as Record<string, unknown>);
    if (ev && !seen.has(ev.externalId)) {
      seen.add(ev.externalId);
      result.push(ev);
    }
  }
  return result;
}

export async function scrapeGoOut(): Promise<{
  events: GoOutEvent[];
  errors: string[];
}> {
  const allEvents = new Map<string, GoOutEvent>();
  const errors: string[] = [];

  for (const path of SCRAPE_PAGES) {
    try {
      const events = await scrapePage(path);
      for (const ev of events) allEvents.set(ev.externalId, ev);
      console.log(`[goout] ${path} → ${events.length} events`);
    } catch (err) {
      const msg = `scrape ${path}: ${(err as Error).message}`;
      errors.push(msg);
      console.error("[goout]", msg);
    }
  }

  return { events: Array.from(allEvents.values()), errors };
}
