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
