/**
 * Maps a discover-wizard area id to the city tokens that may appear on a
 * venue's free-text `city` (or an event's `area`). Used for soft matching so
 * the area the user picked is actually honoured in the results.
 */
export const AREA_CITIES: Record<string, string[]> = {
  "tel-aviv": ["תל אביב", "תל אביב-יפו", "תל-אביב", "tel aviv", "tel-aviv", "tlv"],
  "gush-dan": [
    "רמת גן", "גבעתיים", "בני ברק", "חולון", "בת ים", "פתח תקווה",
    "הרצליה", "רמת השרון", "אור יהודה", "גוש דן",
  ],
  rishon: ["ראשון לציון", "ראשון", "rishon"],
  jerusalem: ["ירושלים", "jerusalem"],
  // "haifa" is the de-facto North bucket — Haifa + the whole northern district
  // (Galilee, valleys, Kinneret, Carmel coast) so northern parties are findable.
  haifa: [
    "חיפה", "קריות", "קרית", "קריון", "haifa",
    "צפון", "הצפון", "מחוז הצפון", "גליל", "galil", "galilee",
    "עמק", "יזרעאל", "כרמיאל", "karmiel", "טבריה", "tiberias",
    "נהריה", "nahariya", "עכו", "akko", "acre", "עפולה", "afula",
    "צפת", "safed", "tzfat", "נצרת", "nazareth", "כנרת", "kinneret",
    "יקנעם", "מגדל העמק", "קצרין", "מעלות", "כרמל", "carmel", "נשר",
    "חדרה", "hadera", "זכרון", "קיסריה", "caesarea",
  ],
  sharon: ["נתניה", "כפר סבא", "רעננה", "הוד השרון", "השרון", "netanya"],
  south: ["אשדוד", "אשקלון", "קרית גת", "שדרות", "אופקים", "דרום", "ashdod"],
  beersheva: ["באר שבע", "באר-שבע", "beer sheva", "beersheva"],
  eilat: ["אילת", "eilat"],
  // "near-me" is location-based and has no city filter.
};

/** True when a free-text city/area string belongs to the selected area id. */
export function cityMatchesArea(area: string | undefined, cityOrArea?: string | null): boolean {
  if (!area || area === "near-me") return true;
  const tokens = AREA_CITIES[area];
  if (!tokens) return true;
  const hay = (cityOrArea ?? "").toLowerCase();
  if (!hay) return false;
  return tokens.some((t) => hay.includes(t.toLowerCase()));
}
