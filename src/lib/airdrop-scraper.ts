/**
 * airdrop.co.il scraper — Israeli party/festival aggregator.
 *
 * The listing pages are server-rendered with structured ".wcard" blocks:
 *   <a class="wcard glass" href="/slug" data-weekday="2">
 *     <div class="wcard__media" style="background-image:url('/uploads/…')">
 *       <span class="wcard__price">החל מ-₪100</span></div>
 *     <div class="wcard__body">
 *       <span class="wcard__day">שלישי · 16.06</span>
 *       <h3>Title</h3>
 *       <span class="wcard__genre">טכנו ואלקטרוני</span>
 *       <p>📍 Venue · City</p></div></a>
 */

import {
  type ScrapedEvent,
  BROWSER_HEADERS,
  isIsraeli,
} from "./scraped-event";

const AIRDROP_BASE = "https://airdrop.co.il";
// events.php is the master list; city pages add geographic coverage.
const SCRAPE_PAGES = [
  "/events.php",
  "/tel-aviv",
  "/jerusalem",
  "/haifa",
  "/eilat",
  "/south",
  "/kinneret",
];

const GENRE_MAP: Record<string, string> = {
  "טכנו ואלקטרוני": "techno",
  טכנו: "techno",
  אלקטרוני: "electronic",
  האוס: "house",
  טראנס: "trance",
  מיינסטרים: "mainstream",
  "היפ הופ": "hiphop",
  רגאטון: "reggaeton",
  מזרחי: "mizrahi",
  ישראלי: "israeli",
  רוק: "rock",
  "הופעות חיות": "live",
};

function mapGenre(he: string): string {
  const t = he.trim();
  return GENRE_MAP[t] ?? "";
}

// "16.06" → Date at 21:00 Israel time, rolling to next year if clearly past.
function parseDate(dayText: string): Date | null {
  const m = dayText.match(/(\d{1,2})\.(\d{1,2})/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (!dd || !mm) return null;
  const now = new Date();
  let year = now.getFullYear();
  // If the month/day is more than a month behind today, assume next year.
  const candidate = new Date(`${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T21:00:00+03:00`);
  if (candidate.getTime() < now.getTime() - 31 * 86400_000) {
    year += 1;
  }
  const d = new Date(`${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T21:00:00+03:00`);
  return isNaN(d.getTime()) ? null : d;
}

function priceAgorot(priceText: string): number {
  const m = priceText.match(/₪\s*([\d,]+)/);
  if (!m) return 0;
  const n = parseInt(m[1].replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n * 100 : 0;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function pick(re: RegExp, block: string): string | null {
  const m = block.match(re);
  return m ? decodeEntities(m[1]) : null;
}

function parseCards(html: string): ScrapedEvent[] {
  const out: ScrapedEvent[] = [];
  // Split on the wcard anchor; each piece (after the first) starts inside a card.
  const blocks = html.split(/<a class="wcard glass"/i).slice(1);
  for (const raw of blocks) {
    const block = raw.slice(0, 1500); // a card is well under this
    const href = pick(/^[^>]*href="([^"]+)"/, block);
    const title = pick(/<h3[^>]*>([^<]+)<\/h3>/, block);
    const dayText = pick(/wcard__day"[^>]*>([^<]+)</, block);
    if (!href || !title || !dayText) continue;

    const startsAt = parseDate(dayText);
    if (!startsAt) continue;

    const img = pick(/background-image:url\('([^']+)'\)/, block);
    const priceText = pick(/wcard__price"[^>]*>([^<]+)</, block) ?? "";
    const genreHe = pick(/wcard__genre"[^>]*>([^<]+)</, block) ?? "";
    const locText = pick(/<p[^>]*>\s*📍?\s*([^<]+)<\/p>/, block) ?? "";

    const locParts = locText.split("·").map((s) => s.trim()).filter(Boolean);
    const venue = locParts[0] ?? "";
    const city = locParts[1] ?? locParts[0] ?? "";
    if (!isIsraeli(`${venue} ${city}`)) continue;

    const slug = href.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
    const externalId = `${slug}|${startsAt.toISOString().slice(0, 10)}`;

    out.push({
      externalId,
      externalUrl: href.startsWith("http") ? href : `${AIRDROP_BASE}${href}`,
      title,
      description: null,
      startsAt,
      endsAt: null,
      address: city || venue,
      city: city || venue,
      lat: null,
      lng: null,
      imageUrl: img ? (img.startsWith("http") ? img : `${AIRDROP_BASE}${img}`) : null,
      genres: mapGenre(genreHe),
      minPriceAgorot: priceAgorot(priceText),
      eventType: "מועדוני לילה",
    });
  }
  return out;
}

async function scrapePage(path: string): Promise<ScrapedEvent[]> {
  const url = `${AIRDROP_BASE}${path}`;
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(20_000) });
    const html = await res.text();
    return parseCards(html);
  } catch {
    console.warn(`[airdrop] fetch failed for ${url}`);
    return [];
  }
}

export async function scrapeAirdrop(): Promise<{ events: ScrapedEvent[]; errors: string[] }> {
  const all = new Map<string, ScrapedEvent>();
  const byTitleDay = new Set<string>();
  const errors: string[] = [];

  for (const path of SCRAPE_PAGES) {
    try {
      const events = await scrapePage(path);
      for (const ev of events) {
        const dayKey = `${ev.title.toLowerCase()}|${ev.startsAt.toISOString().slice(0, 10)}`;
        if (all.has(ev.externalId) || byTitleDay.has(dayKey)) continue;
        all.set(ev.externalId, ev);
        byTitleDay.add(dayKey);
      }
      console.log(`[airdrop] ${path} → ${events.length} events`);
    } catch (err) {
      const msg = `scrape ${path}: ${(err as Error).message}`;
      errors.push(msg);
      console.error("[airdrop]", msg);
    }
  }

  return { events: Array.from(all.values()), errors };
}
