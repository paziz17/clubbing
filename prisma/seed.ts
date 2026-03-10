import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMAGES = [
  "https://images.unsplash.com/photo-1571266028243-d220e8c3c9e2?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=300&fit=crop",
];

// קואורדינטות ערים בישראל — למיון לפי מרחק
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "תל אביב": { lat: 32.0808, lng: 34.7805 },
  "חיפה": { lat: 32.813, lng: 34.999 },
  "נהריה": { lat: 33.005, lng: 35.099 },
  "עכו": { lat: 32.928, lng: 35.082 },
  "כרמיאל": { lat: 32.909, lng: 35.293 },
  "טבריה": { lat: 32.793, lng: 35.531 },
  "הרצליה": { lat: 32.163, lng: 34.844 },
  "רעננה": { lat: 32.184, lng: 34.862 },
  "כפר סבא": { lat: 32.176, lng: 34.906 },
  "נתניה": { lat: 32.331, lng: 34.858 },
  "רמת גן": { lat: 32.085, lng: 34.812 },
  "גבעתיים": { lat: 32.071, lng: 34.812 },
  "ראשון לציון": { lat: 31.964, lng: 34.804 },
  "חולון": { lat: 32.011, lng: 34.77 },
  "ירושלים": { lat: 31.769, lng: 35.216 },
  "באר שבע": { lat: 31.252, lng: 34.791 },
  "מצפה רמון": { lat: 30.609, lng: 34.801 },
  "אילת": { lat: 29.558, lng: 34.951 },
};

// אירועים מכל הארץ — מהצפון ועד אילת
const EVENT_TEMPLATES = [
  // === צפון ===
  { name: "Techno Night", venue: "The Block", tags: ["Techno", "מסיבה", "21+"], location: "תל אביב", address: "רחוב שלום 157, יפו" },
  { name: "House & Minimal", venue: "The Block", tags: ["House", "מסיבה", "21+"], location: "תל אביב", address: "רחוב שלום 157, יפו" },
  { name: "Underground", venue: "Bootleg", tags: ["Techno", "בר", "21+"], location: "תל אביב", address: "המלך ג'ורג' 48" },
  { name: "Hip-Hop Night", venue: "Bootleg", tags: ["Hip-Hop", "בר", "21+"], location: "תל אביב", address: "המלך ג'ורג' 48" },
  { name: "Sunset Party", venue: "Lighthouse", tags: ["House", "Rooftop", "21+"], location: "תל אביב", address: "נמל תל אביב, האנגר 23" },
  { name: "Beach Club", venue: "Lighthouse", tags: ["House", "מסיבה", "21+"], location: "תל אביב", address: "נמל תל אביב, האנגר 23" },
  { name: "Georgian Night", venue: "Nanuchka", tags: ["מזרחית", "בר", "21+"], location: "תל אביב", address: "לילנבלום 28-30" },
  { name: "Trance Paradise", venue: "המועדון", tags: ["Trance", "מסיבה", "21+"], location: "תל אביב", address: "רחוב רוטשילד 45" },
  { name: "Jazz & Cocktails", venue: "אוזי בר", tags: ["ג'אז", "בר", "21+"], location: "תל אביב", address: "רחוב אלנבי 48" },
  { name: "Pop Night", venue: "המועדון", tags: ["פופ", "מסיבה", "18+"], location: "תל אביב", address: "רחוב דיזנגוף 99" },
  // חיפה והצפון
  { name: "Hip-Hop Vibes", venue: "המועדון", tags: ["Hip-Hop", "בר", "18+"], location: "חיפה", address: "רחוב הנשיא 25" },
  { name: "Rock Night", venue: "הבאר", tags: ["רוק", "מסיבה", "18+"], location: "חיפה", address: "רחוב מורדי הגיטאות 15" },
  { name: "Techno Underground", venue: "המחתרת", tags: ["Techno", "מסיבה", "21+"], location: "חיפה", address: "שדרות בן גוריון 12" },
  { name: "מסיבת חוף", venue: "בר החוף", tags: ["House", "מסיבה", "21+"], location: "נהריה", address: "טיילת נהריה" },
  { name: "ערב מזרחית", venue: "המועדון", tags: ["מזרחית", "הופעה", "21+"], location: "נהריה", address: "רחוב הגעתון 45" },
  { name: "Rooftop Night", venue: "הגג", tags: ["House", "Rooftop", "21+"], location: "עכו", address: "העיר העתיקה, עכו" },
  { name: "Live Music", venue: "הבמה", tags: ["רוק", "הופעה", "18+"], location: "עכו", address: "רחוב בן עמי 8" },
  { name: "פסטיבל טבע", venue: "שדה", tags: ["Trance", "פסטיבל", "18+"], location: "כרמיאל", address: "אזור התעשייה" },
  { name: "בר על האגם", venue: "בר האגם", tags: ["House", "בר", "21+"], location: "טבריה", address: "טיילת טבריה" },
  { name: "מסיבת קיץ", venue: "המועדון", tags: ["מיינסטרים", "מסיבה", "21+"], location: "טבריה", address: "רחוב הירדן 22" },
  // מרכז
  { name: "Rooftop Sunset", venue: "הגג", tags: ["House", "Rooftop", "21+"], location: "הרצליה", address: "רחוב סוקולוב 12" },
  { name: "Pool Party", venue: "בר הבריכה", tags: ["House", "מסיבה", "21+"], location: "הרצליה", address: "הרצליה פיתוח" },
  { name: "Purim Party", venue: "המועדון", tags: ["מיינסטרים", "מסיבה", "18+"], location: "רעננה", address: "רחוב אחוזה 100" },
  { name: "Indie Night", venue: "הבמה", tags: ["רוק", "הופעה", "18+"], location: "כפר סבא", address: "רחוב ויצמן 50" },
  { name: "Techno Night", venue: "המועדון", tags: ["Techno", "מסיבה", "21+"], location: "נתניה", address: "רחוב וינגייט 15" },
  { name: "מסיבת חוף", venue: "בר החוף", tags: ["House", "מסיבה", "21+"], location: "נתניה", address: "חוף נתניה" },
  { name: "Pop Night", venue: "המועדון", tags: ["פופ", "מסיבה", "18+"], location: "רמת גן", address: "רחוב ביאליק 8" },
  { name: "Hip-Hop Night", venue: "הבאר", tags: ["Hip-Hop", "בר", "21+"], location: "גבעתיים", address: "רחוב ויצמן 30" },
  { name: "מזרחית Live", venue: "המועדון", tags: ["מזרחית", "הופעה", "21+"], location: "ראשון לציון", address: "רחוב רוטשילד 45" },
  { name: "House Party", venue: "המועדון", tags: ["House", "מסיבה", "21+"], location: "חולון", address: "רחוב סוקולוב 80" },
  // ירושלים והדרום
  { name: "מזרחית Live", venue: "המועדון", tags: ["מזרחית", "הופעה", "21+"], location: "ירושלים", address: "רחוב יפו 34" },
  { name: "Indie Night", venue: "הבמה", tags: ["רוק", "הופעה", "18+"], location: "ירושלים", address: "רחוב עמק רפאים 12" },
  { name: "בר ארמני", venue: "הבאר", tags: ["מזרחית", "בר", "21+"], location: "ירושלים", address: "רחוב הנביאים 15" },
  { name: "Techno Night", venue: "המועדון", tags: ["Techno", "מסיבה", "21+"], location: "באר שבע", address: "רחוב רגר 40" },
  { name: "מסיבת סטודנטים", venue: "המועדון", tags: ["מיינסטרים", "מסיבה", "18+"], location: "באר שבע", address: "קמפוס אוניברסיטה" },
  { name: "ערב בדואי", venue: "האוהל", tags: ["מזרחית", "הופעה", "21+"], location: "באר שבע", address: "אזור התעשייה" },
  { name: "פסטיבל מדבר", venue: "השדה", tags: ["Trance", "פסטיבל", "18+"], location: "מצפה רמון", address: "מכתש רמון" },
  { name: "סטארגייזינג", venue: "המדבר", tags: ["Trance", "פסטיבל", "18+"], location: "מצפה רמון", address: "אזור המכתש" },
  // אילת
  { name: "Beach Party", venue: "המועדון על החוף", tags: ["House", "מסיבה", "21+"], location: "אילת", address: "טיילת אילת" },
  { name: "Pool Party", venue: "בר הבריכה", tags: ["House", "Rooftop", "21+"], location: "אילת", address: "מלון הרודס 1" },
  { name: "מסיבת חוף", venue: "חוף הצפון", tags: ["House", "מסיבה", "21+"], location: "אילת", address: "חוף הצפון" },
  { name: "פסטיבל ים", venue: "המועדון", tags: ["Trance", "פסטיבל", "21+"], location: "אילת", address: "טיילת הדקלים" },
  { name: "בר על הים", venue: "בר הים", tags: ["House", "בר", "21+"], location: "אילת", address: "טיילת אילת" },
];

function getRandomImage() {
  return IMAGES[Math.floor(Math.random() * IMAGES.length)];
}

function getRandomDate(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  d.setHours(22, 0, 0, 0);
  return d;
}

// טלפון לתקשורת — ~50% מהאירועים מקבלים
function getRandomPhone(): string | null {
  if (Math.random() > 0.5) return null;
  const prefixes = ["050", "052", "053", "054", "02", "03", "04", "08"];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = String(Math.floor(Math.random() * 10000000)).padStart(7, "0");
  return p.length === 2 ? `${p}-${rest}` : `${p}-${rest.slice(0, 3)}-${rest.slice(3)}`;
}

export async function runSeed() {
  // רענון אירועים — שומר אירועים מ-Facebook
  await prisma.event.deleteMany({
    where: { OR: [{ source: null }, { source: { not: "facebook" } }] },
  });

  for (const e of EVENT_TEMPLATES) {
    const ageRestriction = e.tags.some((t) => t.includes("21") || t === "21+") ? "21+" : "18+";
    const coords = CITY_COORDS[e.location] ?? CITY_COORDS["תל אביב"];
    await prisma.event.create({
      data: {
        name: e.name,
        description: `${e.name} ב${e.venue}`,
        date: getRandomDate(30),
        time: "22:00",
        location: e.location,
        address: e.address,
        lat: coords.lat,
        lng: coords.lng,
        imageUrl: getRandomImage(),
        ticketLink: null, // אין קישור אמיתי — לא מציגים כפתור רכישה
        phone: getRandomPhone(),
        ageRestriction,
        tags: JSON.stringify(e.tags),
        status: "approved",
      },
    });
  }
  console.log("Seeded", EVENT_TEMPLATES.length, "events from North to Eilat");
}

// הרצה מהטרמינל: npx tsx prisma/seed.ts
const isCli = process.argv[1]?.includes("seed");
if (isCli) {
  runSeed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
