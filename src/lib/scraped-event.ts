/**
 * Shared types & helpers for event scrapers (zygo, airdrop, …).
 * Keeps the same ScrapedEvent shape used by the go-out importer so the sync
 * route can treat every source uniformly.
 */

export interface ScrapedEvent {
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

export const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
};

// Markers that mean an event is NOT in Israel.
const FOREIGN_MARKERS = [
  "greece", "יוון", "athens", "אתונה", "cyprus", "קפריסין", "portugal", "פורטוגל",
  "spain", "ספרד", "barcelona", "ברצלונה", "italy", "איטליה", "germany", "גרמניה",
  "berlin", "ברלין", "thailand", "תאילנד", "georgia", "גאורגיה", "bucharest", "בוקרשט",
  "amsterdam", "london", "paris", "dubai", "דובאי", "tbilisi",
];

const ISRAELI_CITY_TOKENS = [
  "tel aviv", "תל אביב", "tel-aviv", "jerusalem", "ירושלים", "haifa", "חיפה",
  "eilat", "אילת", "herzliya", "הרצליה", "kinneret", "כינרת", "rishon", "ראשון",
  "netanya", "נתניה", "beer sheva", "באר שבע", "ramat", "רמת", "ashdod", "אשדוד",
  "caesarea", "קיסריה", "holon", "חולון", "petah", "פתח", " tlv", "israel", "ישראל",
];

export function isIsraeli(addr: string): boolean {
  if (!addr) return true; // local platforms default to IL when address is missing
  const lower = addr.toLowerCase();
  if (FOREIGN_MARKERS.some((m) => lower.includes(m))) return false;
  if (lower.includes("israel") || addr.includes("ישראל")) return true;
  if (ISRAELI_CITY_TOKENS.some((c) => lower.includes(c))) return true;
  // Unknown but no foreign marker → keep (these are Israeli ticketing platforms).
  return true;
}

export function parseCity(addr: string): string {
  if (!addr) return "";
  const parts = addr.split(/[,·]/).map((s) => s.trim());
  const noCountry = parts.filter(
    (p) => p && !/^israel$/i.test(p) && p !== "ישראל",
  );
  if (noCountry.length >= 2) {
    return noCountry[1].replace(/\d+/g, "").trim() || noCountry[0];
  }
  return (noCountry[0] || addr).replace(/\d+/g, "").trim();
}

/**
 * "Club night" date bucket: events before ~06:00 Israel time belong to the
 * previous evening, so the same party scraped with after-midnight start times
 * lands in the same bucket. (IST = UTC+3; shifting UTC by -3h moves the day
 * boundary to ~06:00 IST.)
 */
export function nightKeyIL(d: Date): string {
  return new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
}

// Low-signal words stripped before comparing titles across sources.
const DEDUP_STOPWORDS = new Set([
  "the", "and", "of", "at", "on", "x", "vs", "w", "with", "by", "a", "an", "to",
  "for", "in", "tlv", "tel", "aviv", "israel", "il", "summer", "opening", "open",
  "קיץ", "פתיחת", "פתיחה", "של", "עם", "את", "על", "ב", "אירוע", "תל", "אביב",
  "יפו", "נמל",
]);

/** Significant title tokens (Hebrew niqqud removed, dates/symbols/stopwords dropped). */
export function titleTokens(title: string): Set<string> {
  const cleaned = (title || "")
    .replace(/[\u0591-\u05C7]/g, "") // strip Hebrew vowel points
    .toLowerCase()
    .replace(/[^\u05D0-\u05EAa-z0-9 ]/g, " ");
  return new Set(
    cleaned
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !DEDUP_STOPWORDS.has(w)),
  );
}

function tokensMatch(a: Set<string>, b: Set<string>): boolean {
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  if (shared < 2) return false; // need at least two distinctive shared tokens
  const union = new Set([...a, ...b]).size;
  return shared / union >= 0.4;
}

/**
 * Group items that describe the SAME real-world event (same club-night +
 * sufficiently similar title) across any source. Returns clusters of the
 * original items; callers keep one per cluster.
 */
export function clusterEvents<T>(
  items: T[],
  getTitle: (t: T) => string,
  getDate: (t: T) => Date,
): T[][] {
  const meta = items.map((it) => ({
    nk: nightKeyIL(getDate(it)),
    tk: titleTokens(getTitle(it)),
  }));
  const parent = items.map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };

  const buckets = new Map<string, number[]>();
  meta.forEach((m, i) => {
    const arr = buckets.get(m.nk) ?? [];
    arr.push(i);
    buckets.set(m.nk, arr);
  });
  for (const idxs of buckets.values()) {
    for (let a = 0; a < idxs.length; a++) {
      for (let b = a + 1; b < idxs.length; b++) {
        if (tokensMatch(meta[idxs[a]].tk, meta[idxs[b]].tk)) union(idxs[a], idxs[b]);
      }
    }
  }

  const groups = new Map<number, T[]>();
  items.forEach((it, i) => {
    const r = find(i);
    const arr = groups.get(r) ?? [];
    arr.push(it);
    groups.set(r, arr);
  });
  return Array.from(groups.values());
}

// Keywords that mark an event as part of the LGBTQ+ / Pride community.
const PRIDE_KEYWORDS = [
  "pride", "lgbt", "lgbtq", "queer", "gay", "drag", "arisa", "gogay",
  "גאווה", "להטב", "קוויר", "דראג", "אריסה", "פרייד", "קהילה הגאה", "מסיבת גאווה",
];

/** True when the given text clearly belongs to a Pride / LGBTQ+ event. */
export function isPrideText(text: string): boolean {
  const t = (text || "").toLowerCase();
  return PRIDE_KEYWORDS.some((k) => t.includes(k));
}

/** Ensure the "pride" tag is present in a genres string when applicable. */
export function withPrideTag(genres: string, pride: boolean): string {
  const list = (genres || "").split(",").map((s) => s.trim()).filter(Boolean);
  const hasPride = list.includes("pride");
  if (pride && !hasPride) list.push("pride");
  return list.join(",");
}

export function extractNextData(html: string): Record<string, unknown> | null {
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
