/**
 * Seed CLUBBING — מרפסת מלה רמת ישי · Full CRM demo data
 * Run: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function daysAgo(n: number, h = 20) {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d;
}
function daysFromNow(n: number, h = 20) {
  const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d;
}
function nextWeekday(dow: number, h = 22, w = 0) {
  const d = new Date();
  d.setDate(d.getDate() + ((dow + 7 - d.getDay()) % 7 || 7) + w * 7);
  d.setHours(h, 0, 0, 0); return d;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  console.log("🌙 Seeding מרפסת מלה — Full CRM demo...");
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const rates = JSON.stringify({ REGULAR: 0.02, SILVER: 0.03, GOLD: 0.04, PLATINUM: 0.05 });

  // ══════════════════════════════════════════════════
  //  1. VENUE
  // ══════════════════════════════════════════════════
  const venue = await db.venue.upsert({
    where: { username: "mirpeset" },
    create: {
      slug: "mirpeset-mala-ramat-yishai",
      name: "מרפסת מלה — רמת ישי",
      username: "mirpeset",
      passwordHash,
      description: "מתחם בוטיק בלב עמק יזרעאל · מסעדת רופטופ ים-תיכונית + מתחם אירועים · חתונות, מסיבות, כנסים ועוד",
      address: "חורש האלונים 18, רמת ישי",
      city: "רמת ישי",
      lat: 32.7012, lng: 35.1645,
      isExclusive: false,
      kitchenEnabled: true,
      settings: { create: { creditRatePerTier: rates } },
    },
    update: {},
  });

  // ══════════════════════════════════════════════════
  //  2. ARTISTS
  // ══════════════════════════════════════════════════
  const djShay = await db.artist.upsert({
    where: { slug: "dj-shay" },
    create: {
      slug: "dj-shay", name: "DJ Shay",
      bio: "דיג׳יי מהצפון – מזרחית, ים-תיכוני, מסיבות טבע. 10+ שנות ניסיון.",
      genres: "מזרחית,ים-תיכוני",
      links: JSON.stringify({ instagram: "https://instagram.com/djshay_il" }),
    }, update: {},
  });
  const djNevo = await db.artist.upsert({
    where: { slug: "dj-nevo" },
    create: {
      slug: "dj-nevo", name: "נבו & Friends",
      bio: "קבוצת הפקה – מסיבות קיץ, אחרי-חתונה, אירועי חברה בצפון.",
      genres: "pop,house,electronic",
      links: JSON.stringify({ instagram: "https://instagram.com/nevo_events" }),
    }, update: {},
  });
  const jazzBand = await db.artist.upsert({
    where: { slug: "jazz-valley" },
    create: {
      slug: "jazz-valley", name: "Jazz Valley Quartet",
      bio: "רביעיית ג׳אז מהצפון – סטנדרטים ואריג׳ינלים ים-תיכוניים.",
      genres: "jazz,world",
      links: JSON.stringify({ instagram: "https://instagram.com/" }),
    }, update: {},
  });

  // ══════════════════════════════════════════════════
  //  3. EVENTS
  // ══════════════════════════════════════════════════
  await db.event.deleteMany({ where: { venueId: venue.id } });

  // Past events (for CRM history / analytics)
  const evPurim = await db.event.create({ data: {
    venueId: venue.id, artistId: djShay.id,
    name: "תיכוניסטים במרפסת — פורים 2026",
    description: "600 תלמידים, DJ מעולה, תחפושות. SOLD OUT.",
    startsAt: daysAgo(75, 21), endsAt: daysAgo(74, 3),
    type: "PARTY", genres: "pop,hip-hop", ageBands: "AGE_18_21", area: "צפון",
    status: "ENDED", basePriceAgorot: 6000, capacity: 600, tags: "פורים,תיכוניסטים,sold-out",
    lat: 32.7012, lng: 35.1645,
    tickets: { create: [
      { kind: "STANDARD", label: "כניסה רגילה", priceAgorot: 6000, stock: 0, sold: 480 },
      { kind: "EARLY_BIRD", label: "Early Bird", priceAgorot: 4500, stock: 0, sold: 120 },
    ]},
  }});

  const evSummer25 = await db.event.create({ data: {
    venueId: venue.id, artistId: djNevo.id,
    name: "Summer Night 2025 — בר פתוח",
    description: "מסיבת קיץ פסגה. 5 שעות DJ. אזל.",
    startsAt: daysAgo(40, 22), endsAt: daysAgo(39, 4),
    type: "PARTY", genres: "house,electronic", ageBands: "AGE_21_25,AGE_25_30", area: "צפון",
    status: "ENDED", basePriceAgorot: 9000, capacity: 400, tags: "קיץ,sold-out",
    lat: 32.7012, lng: 35.1645,
    tickets: { create: [
      { kind: "EARLY_BIRD", label: "Early Bird", priceAgorot: 6000, stock: 0, sold: 80 },
      { kind: "STANDARD", label: "כניסה רגילה", priceAgorot: 9000, stock: 0, sold: 280 },
      { kind: "VIP", label: "VIP Lounge", priceAgorot: 22000, stock: 0, sold: 40 },
    ]},
  }});

  const evJazz25 = await db.event.create({ data: {
    venueId: venue.id, artistId: jazzBand.id,
    name: "ג׳אז על הגג — אוגוסט 2025",
    description: "ערב ג׳אז אינטימי עם 60 אורחים.",
    startsAt: daysAgo(15, 20), endsAt: daysAgo(15, 24),
    type: "LIVE", genres: "jazz", ageBands: "AGE_30_40,AGE_40_PLUS", area: "צפון",
    status: "ENDED", basePriceAgorot: 18000, capacity: 60, tags: "ג׳אז,דגסטציה",
    lat: 32.7015, lng: 35.1648,
    tickets: { create: [
      { kind: "STANDARD", label: "מקום + דגסטציה", priceAgorot: 18000, stock: 0, sold: 52 },
      { kind: "VIP", label: "שולחן 2 + יין", priceAgorot: 42000, stock: 0, sold: 8 },
    ]},
  }});

  // Upcoming events
  const evWedding = await db.event.create({ data: {
    venueId: venue.id, artistId: djShay.id,
    name: "חתונת קיץ — שמחות כהן",
    description: "חתונה חצי-אורבנית עם רחבת ריקודים פתוחה, בר פתוח ומרפסת קסומה. 350 מוזמנים.",
    startsAt: nextWeekday(5, 18), endsAt: nextWeekday(6, 2),
    type: "PARTY", genres: "מזרחית,pop", ageBands: "AGE_21_25,AGE_25_30,AGE_30_40", area: "צפון",
    status: "PUBLISHED", basePriceAgorot: 0, capacity: 350, tags: "חתונה,פרטי",
    lat: 32.7012, lng: 35.1645,
    tickets: { create: [
      { kind: "STANDARD", label: "כניסת אורח", priceAgorot: 0, stock: 320 },
      { kind: "VIP", label: "שולחן VIP + בר פתוח", priceAgorot: 45000, stock: 30 },
    ]},
  }});

  const evBarMitz = await db.event.create({ data: {
    venueId: venue.id,
    name: "בר מצווה — יונתן לוי",
    description: "מגרש ריקודים נפרד לילדים, רחבה למבוגרים, צוות מקצועי.",
    startsAt: nextWeekday(0, 17, 1), endsAt: nextWeekday(0, 23, 1),
    type: "PARTY", genres: "pop,מזרחית", ageBands: "AGE_18_21,AGE_25_30,AGE_30_40", area: "צפון",
    status: "PUBLISHED", basePriceAgorot: 0, capacity: 200, tags: "בר מצווה,משפחות",
    lat: 32.7012, lng: 35.1645,
    tickets: { create: [{ kind: "STANDARD", label: "כניסת אורח", priceAgorot: 0, stock: 200 }]},
  }});

  const evNight = await db.event.create({ data: {
    venueId: venue.id, artistId: djNevo.id,
    name: "Summer Night 2026 — מרפסת פתוחה",
    description: "מסיבת קיץ בשמים פתוחים · DJ Set 6 שעות · בר פתוח",
    startsAt: nextWeekday(6, 22), endsAt: daysFromNow(8, 4),
    type: "PARTY", genres: "house,electronic,pop", ageBands: "AGE_21_25,AGE_25_30", area: "צפון",
    status: "PUBLISHED", basePriceAgorot: 9000, capacity: 400, tags: "+21,summer",
    lat: 32.7012, lng: 35.1645,
    tickets: { create: [
      { kind: "EARLY_BIRD", label: "Early Bird", priceAgorot: 6000, stock: 40, sold: 40 },
      { kind: "STANDARD", label: "כניסה רגילה", priceAgorot: 9000, stock: 250, sold: 87 },
      { kind: "VIP", label: "VIP Lounge + משקאות", priceAgorot: 22000, stock: 40, sold: 12 },
    ]},
  }});

  const evJazz = await db.event.create({ data: {
    venueId: venue.id, artistId: jazzBand.id,
    name: "ג׳אז על הגג — יוני 2026",
    description: "ערב אינטימי עם רביעיית ג׳אז חיה, תפריט דגסטציה ים-תיכוני.",
    startsAt: nextWeekday(4, 20), endsAt: nextWeekday(5, 0),
    type: "LIVE", genres: "jazz,ים-תיכוני", ageBands: "AGE_25_30,AGE_30_40,AGE_40_PLUS", area: "צפון",
    status: "PUBLISHED", basePriceAgorot: 18000, capacity: 60, tags: "ג׳אז,דגסטציה,אינטימי",
    lat: 32.7015, lng: 35.1648,
    tickets: { create: [
      { kind: "STANDARD", label: "מקום + דגסטציה", priceAgorot: 18000, stock: 44, sold: 16 },
      { kind: "VIP", label: "שולחן VIP 2 + יין", priceAgorot: 42000, stock: 8, sold: 2 },
    ]},
  }});

  const evBrunch = await db.event.create({ data: {
    venueId: venue.id,
    name: "ברנץ׳ שישי על הגג",
    description: "ברנץ׳ עם נוף לעמק יזרעאל, מנות ים-תיכוניות ומיצים סחוטים.",
    startsAt: nextWeekday(5, 10), endsAt: nextWeekday(5, 15),
    type: "COCKTAILS", genres: "", ageBands: "AGE_25_30,AGE_30_40,AGE_40_PLUS", area: "צפון",
    status: "PUBLISHED", basePriceAgorot: 9800, capacity: 80, tags: "ברנץ׳,שישי,נוף",
    lat: 32.7015, lng: 35.1648,
    tickets: { create: [{ kind: "STANDARD", label: "כיסוי + תפריט ברנץ׳", priceAgorot: 9800, stock: 55, sold: 25 }]},
  }});

  const evCorp = await db.event.create({ data: {
    venueId: venue.id,
    name: "כנס חברה — טכנולוגיה ישראלית",
    description: "כנס עסקי בוטיק, 150 עובדים, ארוחת ערב + מסיבת סיום.",
    startsAt: nextWeekday(3, 14, 1), endsAt: nextWeekday(3, 23, 1),
    type: "COCKTAILS", genres: "", ageBands: "AGE_25_30,AGE_30_40,AGE_40_PLUS", area: "צפון",
    status: "PUBLISHED", basePriceAgorot: 0, capacity: 150, tags: "אירוע חברה,כנס",
    lat: 32.7012, lng: 35.1645,
    tickets: { create: [{ kind: "STANDARD", label: "כניסת עובד", priceAgorot: 0, stock: 150 }]},
  }});

  // ══════════════════════════════════════════════════
  //  4. FOOD MENU — מלה רופטופ (כשר, ים-תיכוני)
  // ══════════════════════════════════════════════════
  await db.foodMenuItem.deleteMany({ where: { venueId: venue.id } });
  const menuItems = await db.foodMenuItem.createManyAndReturn({
    data: [
      // ── STARTERS ──
      { venueId: venue.id, name: "חומוס ביתי עם עמבה", description: "חומוס קרמי, שמן זית כבד, עמבה מנגו, פיתה טרייה", category: "STARTER", priceAgorot: 5800, prepMinutes: 6 },
      { venueId: venue.id, name: "טרטר סלמון", description: "סלמון טרי, שמן שומשום, צ׳ילי, מנגו, קרקר רייס", category: "STARTER", priceAgorot: 9200, prepMinutes: 8 },
      { venueId: venue.id, name: "ברוסקטת עגבניות שרי", description: "סיאבטה קלוי, עגבניות שרי, בזיל, שמן זית", category: "STARTER", priceAgorot: 4800, prepMinutes: 5 },
      { venueId: venue.id, name: "סלט ספינאקי יווני", description: "תרד, פטה, זיתים קלמטה, בצל סגול, ויניגרט לימון", category: "STARTER", priceAgorot: 5200, prepMinutes: 5 },
      { venueId: venue.id, name: "שרימפס סקמפי", description: "שרימפס ענק, חמאה, שום, לימון, לחם בריוש", category: "STARTER", priceAgorot: 8600, prepMinutes: 10 },
      { venueId: venue.id, name: "מרק עגבניות שרשי", description: "עגבניות קלויות, שמנת, בזיל, לחם פריך", category: "STARTER", priceAgorot: 4400, prepMinutes: 7 },
      { venueId: venue.id, name: "פיצה גורמה שאקשוקה", description: "בסיס עגבניות, ביצה שלמה, פטה, זיתים קלמטה", category: "STARTER", priceAgorot: 6200, prepMinutes: 12 },
      { venueId: venue.id, name: "לחם שום ביתי", description: "לחם פוקאצ׳ה ביתי, שמן זית, שום, רוזמרין", category: "STARTER", priceAgorot: 3200, prepMinutes: 8 },
      // ── MAINS ──
      { venueId: venue.id, name: "אנטריקוט 300gr על הגריל", description: "שחור-אנגוס, צ׳ימיצ׳ורי, פטריות שמפיניון, ציפס ביתי", category: "MAIN", priceAgorot: 17900, prepMinutes: 18 },
      { venueId: venue.id, name: "פילה סלמון נורווגי", description: "סלמון צלוי, ירקות שורש בתנור, רוטב מנגו-דיל", category: "MAIN", priceAgorot: 13800, prepMinutes: 16 },
      { venueId: venue.id, name: "פסטה ים-תיכונית", description: "ספגטי, שרימפס טייגר, שמן זית, שום, עגבניות, בזיל", category: "MAIN", priceAgorot: 11400, prepMinutes: 14 },
      { venueId: venue.id, name: "המבורגר מרפסת 220gr", description: "בשר טרי, צ׳דר, קרמל בצל, חמאת טרופות, לחמניית בריוש", category: "MAIN", priceAgorot: 9800, prepMinutes: 15 },
      { venueId: venue.id, name: "מג׳דרה מרפסת", description: "עדשים, אורז, בצל מטוגן קריספי, יוגורט, סלט", category: "MAIN", priceAgorot: 7200, prepMinutes: 10 },
      { venueId: venue.id, name: "שיפוד עוף ים-תיכוני", description: "עוף מרינד, ירקות גריל, טחינה, לחמניית פיתה", category: "MAIN", priceAgorot: 8900, prepMinutes: 16 },
      { venueId: venue.id, name: "ריזוטו פטריות יער", description: "ריזוטו קרמי, פטריות שמפיניון, פורצ׳יני, פרמזן, כמהין", category: "MAIN", priceAgorot: 10400, prepMinutes: 18 },
      { venueId: venue.id, name: "מגש שיפודים מעורב", description: "עוף, בקר, קבב, ירקות גריל, אורז, לחם", category: "MAIN", priceAgorot: 16800, prepMinutes: 20 },
      // ── DESSERTS ──
      { venueId: venue.id, name: "פונדנט שוקולד בלגי", description: "לב שוקולד נמס, גלידת וניל, שבבי אורו", category: "DESSERT", priceAgorot: 5400, prepMinutes: 12 },
      { venueId: venue.id, name: "טרט לימון מרנג", description: "קרם לימון חמצמץ, מרנג שרוף, עוגיית פרל", category: "DESSERT", priceAgorot: 4800, prepMinutes: 5 },
      { venueId: venue.id, name: "גלידת פיסטוק עם בקלאווה", description: "גלידה תוצרת בית, בקלאווה, דבש, עלי מנטה", category: "DESSERT", priceAgorot: 4200, prepMinutes: 3 },
      { venueId: venue.id, name: "עוגת גבינה ניו-יורק", description: "קרמית, רוטב תות טרי, קצפת", category: "DESSERT", priceAgorot: 4600, prepMinutes: 3 },
      { venueId: venue.id, name: "טירמיסו קלאסי", description: "מסקרפונה, ספונג׳, אספרסו, קקאו", category: "DESSERT", priceAgorot: 4400, prepMinutes: 3 },
      // ── DRINKS ──
      { venueId: venue.id, name: "מוחיטו קלאסי", description: "רום לבן, ליים, נענע, סוכר, סודה", category: "DRINK", priceAgorot: 4800, prepMinutes: 3 },
      { venueId: venue.id, name: "קוקטייל מרפסת (בית)", description: "ג׳ין, טוניק, קיווי, מלפפון, קצפת", category: "DRINK", priceAgorot: 5200, prepMinutes: 4 },
      { venueId: venue.id, name: "יין לבן — יכין חצי יבש", description: "כוס 150ml", category: "DRINK", priceAgorot: 3800, prepMinutes: 2 },
      { venueId: venue.id, name: "יין אדום — רמת הגולן קברנה", description: "כוס 150ml", category: "DRINK", priceAgorot: 4200, prepMinutes: 2 },
      { venueId: venue.id, name: "בירה Goldstar", description: "בקבוק 330ml קר", category: "DRINK", priceAgorot: 2800, prepMinutes: 1 },
      { venueId: venue.id, name: "בירה Heineken", description: "בקבוק 330ml קר", category: "DRINK", priceAgorot: 3000, prepMinutes: 1 },
      { venueId: venue.id, name: "מיץ תפוזים סחוט טרי", description: "3 תפוזים, 300ml", category: "DRINK", priceAgorot: 2200, prepMinutes: 3 },
      { venueId: venue.id, name: "לימונדה ביתית", description: "לימון, נענע, סוכר קנים, סודה", category: "DRINK", priceAgorot: 1800, prepMinutes: 3 },
      { venueId: venue.id, name: "אספרסו / קפה", description: "אספרסו כפול / אמריקאנו", category: "DRINK", priceAgorot: 1400, prepMinutes: 2 },
      { venueId: venue.id, name: "מים מינרלים", description: "בקבוק 500ml", category: "DRINK", priceAgorot: 1200, prepMinutes: 1 },
    ],
  });

  // ══════════════════════════════════════════════════
  //  5. DEMO USERS + CLUB-IT CARDS
  // ══════════════════════════════════════════════════
  const usersData = [
    { name: "נגה כהן",      email: "noga@demo.il",    city: "רמת ישי",    gender: "FEMALE", tier: "GOLD",     total: 320000, birth: "1995-03-12" },
    { name: "ליאת לוי",     email: "liat@demo.il",    city: "חיפה",       gender: "FEMALE", tier: "SILVER",   total: 120000, birth: "1998-07-22" },
    { name: "עומר מזרחי",   email: "omer@demo.il",    city: "עפולה",      gender: "MALE",   tier: "PLATINUM", total: 680000, birth: "1992-11-05" },
    { name: "שני אברהם",    email: "shani@demo.il",   city: "נצרת עילית", gender: "FEMALE", tier: "REGULAR",  total: 35000,  birth: "2001-04-18" },
    { name: "יובל ברזילי",  email: "yuval@demo.il",   city: "קרית אתא",   gender: "MALE",   tier: "SILVER",   total: 95000,  birth: "1997-09-30" },
    { name: "מיכל שמש",     email: "michal@demo.il",  city: "נשר",        gender: "FEMALE", tier: "GOLD",     total: 280000, birth: "1994-01-15" },
    { name: "רן פרידמן",    email: "ran@demo.il",     city: "חיפה",       gender: "MALE",   tier: "SILVER",   total: 145000, birth: "1996-06-08" },
    { name: "תמר גולן",     email: "tamar@demo.il",   city: "רמת ישי",    gender: "FEMALE", tier: "REGULAR",  total: 22000,  birth: "2003-12-25" },
    { name: "איתי כץ",      email: "itai@demo.il",    city: "זכרון יעקב", gender: "MALE",   tier: "GOLD",     total: 410000, birth: "1990-08-19" },
    { name: "דנה שפירא",    email: "dana@demo.il",    city: "כרמיאל",     gender: "FEMALE", tier: "REGULAR",  total: 48000,  birth: "2000-02-14" },
    { name: "אבי ורשבסקי",  email: "avi@demo.il",     city: "רמת ישי",    gender: "MALE",   tier: "PLATINUM", total: 920000, birth: "1985-05-03" },
    { name: "סיון כרמי",    email: "sivan@demo.il",   city: "יוקנעם",     gender: "FEMALE", tier: "SILVER",   total: 175000, birth: "1999-10-11" },
  ];

  const createdUsers: Array<{ id: string; name: string; tier: string; total: number }> = [];
  for (const u of usersData) {
    const user = await db.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email, name: u.name, city: u.city, gender: u.gender,
        role: "BLINER", birthDate: new Date(u.birth),
      },
      update: {},
    });
    const existing = await db.clubItCard.findUnique({ where: { userId: user.id } });
    if (!existing) {
      await db.clubItCard.create({
        data: {
          userId: user.id,
          cardNumberLast4: String(rand(1000, 9999)),
          displayName: u.name,
          tier: u.tier,
          totalSpentAgorot: u.total,
          isActive: true,
          balances: {
            create: {
              venueId: venue.id,
              creditsBalance: Math.floor(u.total * 0.03),
              creditsAccrued: Math.floor(u.total * 0.03),
              creditsRedeemed: 0,
            },
          },
        },
      });
    }
    createdUsers.push({ id: user.id, name: u.name, tier: u.tier, total: u.total });
  }

  // ══════════════════════════════════════════════════
  //  6. RESERVATIONS + TRANSACTIONS (history)
  // ══════════════════════════════════════════════════
  const pastEvents = [evPurim, evSummer25, evJazz25];
  const upcomingEvents = [evNight, evJazz, evBrunch];

  // Past reservations (PAID)
  const reservationData = [
    { userIdx: 0, event: evSummer25, ticket: "STANDARD", qty: 2, price: 9000,  daysBack: 39, method: "GROW" },
    { userIdx: 1, event: evPurim,    ticket: "STANDARD", qty: 1, price: 6000,  daysBack: 74, method: "GOOGLE_PAY"  },
    { userIdx: 2, event: evSummer25, ticket: "VIP",      qty: 2, price: 22000, daysBack: 39, method: "GROW" },
    { userIdx: 3, event: evPurim,    ticket: "EARLY_BIRD",qty: 1,price: 4500,  daysBack: 74, method: "CLUB_IT"    },
    { userIdx: 4, event: evJazz25,   ticket: "STANDARD", qty: 2, price: 18000, daysBack: 14, method: "GROW" },
    { userIdx: 5, event: evSummer25, ticket: "STANDARD", qty: 1, price: 9000,  daysBack: 38, method: "APPLE_PAY"  },
    { userIdx: 6, event: evJazz25,   ticket: "VIP",      qty: 1, price: 42000, daysBack: 14, method: "GROW" },
    { userIdx: 8, event: evPurim,    ticket: "STANDARD", qty: 3, price: 6000,  daysBack: 73, method: "GROW" },
    { userIdx: 10, event: evSummer25,ticket: "VIP",      qty: 2, price: 22000, daysBack: 40, method: "CREDITS"    },
    { userIdx: 11, event: evJazz25,  ticket: "STANDARD", qty: 2, price: 18000, daysBack: 15, method: "GROW" },
    // Upcoming reservations
    { userIdx: 0, event: evNight,  ticket: "VIP",      qty: 2, price: 22000, daysBack: -6,  method: "GROW" },
    { userIdx: 1, event: evNight,  ticket: "STANDARD", qty: 1, price: 9000,  daysBack: -3,  method: "GOOGLE_PAY"  },
    { userIdx: 2, event: evJazz,   ticket: "VIP",      qty: 1, price: 42000, daysBack: -2,  method: "GROW" },
    { userIdx: 4, event: evBrunch, ticket: "STANDARD", qty: 2, price: 9800,  daysBack: -1,  method: "APPLE_PAY"  },
    { userIdx: 5, event: evJazz,   ticket: "STANDARD", qty: 2, price: 18000, daysBack: -4,  method: "GROW" },
    { userIdx: 9, event: evNight,  ticket: "STANDARD", qty: 3, price: 9000,  daysBack: -1,  method: "CLUB_IT"    },
  ];

  for (const r of reservationData) {
    const u = createdUsers[r.userIdx];
    if (!u) continue;
    const total = r.qty * r.price;
    const fee = Math.floor(total * 0.05);
    const vat = Math.floor(total * 0.17);
    const res = await db.reservation.create({
      data: {
        userId: u.id,
        venueId: venue.id,
        eventId: r.event.id,
        guestName: u.name,
        quantity: r.qty,
        amountAgorot: total,
        feeAgorot: fee,
        vatAgorot: vat,
        totalAgorot: total + fee,
        status: "PAID",
        paymentMethod: r.method,
        creditsEarned: Math.floor(total * 0.03),
        createdAt: r.daysBack > 0 ? daysAgo(r.daysBack) : daysFromNow(-r.daysBack),
      },
    });
    await db.transaction.create({
      data: {
        reservationId: res.id,
        userId: u.id,
        venueId: venue.id,
        amountAgorot: total + fee,
        creditsDelta: Math.floor(total * 0.03),
        paymentMethod: r.method,
        status: "PAID",
        createdAt: res.createdAt,
      },
    });
  }

  // ══════════════════════════════════════════════════
  //  7. CHECK-INS
  // ══════════════════════════════════════════════════
  const checkInUsers = createdUsers.slice(0, 8);
  for (let i = 0; i < checkInUsers.length; i++) {
    await db.checkIn.create({
      data: {
        userId: checkInUsers[i].id,
        venueId: venue.id,
        lat: 32.7012 + (Math.random() - 0.5) * 0.001,
        lng: 35.1645 + (Math.random() - 0.5) * 0.001,
        buddyCount: rand(0, 4),
        creditsEarned: 200,
        createdAt: daysAgo(rand(1, 45)),
      },
    });
  }

  // ══════════════════════════════════════════════════
  //  8. REVIEWS (based on real Rest.co.il reviews)
  // ══════════════════════════════════════════════════
  const reviewsData = [
    { userIdx: 0,  eventId: evJazz25.id, stars: 5, comment: "מקום מושלם עם אווירה של חול. האוכל היה ממש מעולה, השירות מקצועי והאווירה מושלמת!", cats: { ambiance: 5, music: 5, service: 5, value: 4, bars: 5 }, daysBack: 14 },
    { userIdx: 1,  eventId: evSummer25.id, stars: 4, comment: "מקום ברמה אחרת! יפהפה, אחלה אוכל אבל יקר :) השירות היה מקסים!", cats: { ambiance: 5, music: 4, service: 5, value: 3, bars: 4 }, daysBack: 38 },
    { userIdx: 4,  eventId: evJazz25.id, stars: 4, comment: "היה ממש כיף וטעים. המקום מהמם. שירות מעולה. קצת יקר אבל מומלץ בחום!", cats: { ambiance: 5, music: 4, service: 5, value: 3, bars: 4 }, daysBack: 15 },
    { userIdx: 5,  eventId: evSummer25.id, stars: 4, comment: "נורא נהנינו, אוכל טוב, אווירה מעולה. נתנו שירות מדהים וכיפי!", cats: { ambiance: 5, music: 4, service: 5, value: 3, bars: 4 }, daysBack: 37 },
    { userIdx: 2,  eventId: evPurim.id, stars: 5, comment: "פשוט מהמם. המרפסת הפתוחה בלילה זה חוויה אחרת לחלוטין. מגיעים שוב!", cats: { ambiance: 5, music: 5, service: 4, value: 4, bars: 5 }, daysBack: 73 },
    { userIdx: 6,  eventId: evJazz25.id, stars: 5, comment: "המלצרית נהדרת. מקצועית, נעימה ואדיבה. האוכל — טעים בטירוף!", cats: { ambiance: 5, music: 5, service: 5, value: 4, bars: 5 }, daysBack: 14 },
    { userIdx: 8,  eventId: evPurim.id, stars: 3, comment: "מקום יפה, אבל ההמתנה לאוכל הייתה ארוכה. האווירה נהדרת.", cats: { ambiance: 4, music: 4, service: 3, value: 2, bars: 4 }, daysBack: 71 },
    { userIdx: 10, eventId: evSummer25.id, stars: 4, comment: "VIP Lounge שווה כל שקל. תצוגה לעמק, מוסיקה מעולה. מומלץ!", cats: { ambiance: 5, music: 4, service: 4, value: 3, bars: 4 }, daysBack: 39 },
    { userIdx: 11, eventId: evJazz25.id, stars: 5, comment: "הג׳אז + הדגסטציה — שילוב מושלם. האוכל הים-תיכוני מדהים.", cats: { ambiance: 5, music: 5, service: 5, value: 4, bars: 5 }, daysBack: 15 },
  ];

  for (const r of reviewsData) {
    const u = createdUsers[r.userIdx];
    if (!u) continue;
    await db.venueReview.create({
      data: {
        userId: u.id,
        venueId: venue.id,
        eventId: r.eventId,
        stars: r.stars,
        categories: JSON.stringify(r.cats),
        comment: r.comment,
        crmStatus: r.daysBack > 20 ? "READ" : "UNREAD",
        createdAt: daysAgo(r.daysBack),
      },
    });
  }

  // ══════════════════════════════════════════════════
  //  9. CAMPAIGNS (WhatsApp CRM)
  // ══════════════════════════════════════════════════
  await db.campaign.createMany({
    data: [
      {
        venueId: venue.id,
        kind: "FREE_ENTRY_WOMEN",
        message: "🎉 היי! הערב ב-מרפסת מלה — כניסת נשים חינם עד 23:00! DJ Shay על הדקס. מגיעות? 💃",
        audience: "WOMEN_ONLY",
        recipients: 180,
        delivered: 174,
        status: "SENT",
        createdAt: daysAgo(38),
        sentAt: daysAgo(38),
      },
      {
        venueId: venue.id,
        kind: "CHASER_50",
        message: "⚡️ 50% הנחה על כרטיסים ל-Summer Night! רק 20 מקומות נשארו. לא תוחמיצו → clubbing.co.il",
        audience: "SILVER_AND_UP",
        recipients: 95,
        delivered: 91,
        status: "SENT",
        createdAt: daysAgo(42),
        sentAt: daysAgo(42),
      },
      {
        venueId: venue.id,
        kind: "CUSTOM",
        message: "🎶 ג׳אז על הגג חוזר! יוני 2026 — רביעיית Jazz Valley + תפריט דגסטציה ים-תיכוני. כרטיסים עכשיו!",
        audience: "ALL_MEMBERS",
        recipients: 312,
        delivered: 298,
        status: "SENT",
        createdAt: daysAgo(5),
        sentAt: daysAgo(5),
      },
      {
        venueId: venue.id,
        kind: "FREE_ENTRY_WOMEN",
        message: "🌅 ברנץ׳ שישי על הגג — מקומות אחרונים! נוף לעמק, מנות ים-תיכוניות ומיצים סחוטים. 10:00–15:00",
        audience: "ALL_MEMBERS",
        recipients: 0,
        delivered: 0,
        status: "DRAFT",
        createdAt: daysAgo(1),
      },
    ],
  });

  // ══════════════════════════════════════════════════
  //  10. FOOD ORDERS (demo kitchen activity)
  // ══════════════════════════════════════════════════
  const foodItemsForOrders = menuItems.slice(0, 10);

  const foodOrdersData = [
    { userIdx: 0, items: [0, 8], qtys: [1, 1], daysBack: 14, status: "COLLECTED" },
    { userIdx: 1, items: [1, 22], qtys: [1, 2], daysBack: 15, status: "COLLECTED" },
    { userIdx: 4, items: [9, 16, 17], qtys: [2, 1, 2], daysBack: 15, status: "COLLECTED" },
    { userIdx: 6, items: [8, 18], qtys: [1, 1], daysBack: 15, status: "COLLECTED" },
    { userIdx: 2, items: [0, 10, 19], qtys: [1, 1, 1], daysBack: 39, status: "COLLECTED" },
    { userIdx: 5, items: [2, 8, 23], qtys: [2, 1, 1], daysBack: 38, status: "COLLECTED" },
    { userIdx: 3, items: [6, 28], qtys: [1, 2], daysBack: 1, status: "READY" },
    { userIdx: 7, items: [0, 22, 29], qtys: [1, 1, 2], daysBack: 0, status: "PREPARING" },
  ];

  for (const fo of foodOrdersData) {
    const u = createdUsers[fo.userIdx];
    if (!u) continue;
    const orderItems = fo.items.map((idx, i) => {
      const item = foodItemsForOrders[Math.min(idx, foodItemsForOrders.length - 1)];
      return { itemId: item.id, qty: fo.qtys[i], unitPriceAgorot: item.priceAgorot };
    });
    const subtotal = orderItems.reduce((s, i) => s + i.qty * i.unitPriceAgorot, 0);
    await db.foodOrder.create({
      data: {
        pickupCode: `ML${rand(100, 999)}`,
        userId: u.id,
        venueId: venue.id,
        items: JSON.stringify(orderItems.map(i => ({ itemId: i.itemId, qty: i.qty, price: i.unitPriceAgorot }))),
        subtotalAgorot: subtotal,
        cardChargedAgorot: subtotal,
        paymentMethod: "GROW",
        status: fo.status,
        createdAt: fo.daysBack > 0 ? daysAgo(fo.daysBack) : new Date(),
        orderItems: { create: orderItems },
      },
    });
  }

  // ══════════════════════════════════════════════════
  //  11. VOUCHERS
  // ══════════════════════════════════════════════════
  const voucherUsers = createdUsers.filter(u => u.tier === "GOLD" || u.tier === "PLATINUM");
  for (const u of voucherUsers.slice(0, 4)) {
    const card = await db.clubItCard.findUnique({ where: { userId: u.id } });
    if (!card) continue;
    await db.voucher.create({
      data: {
        code: `MALA-${rand(10000, 99999)}`,
        cardId: card.id,
        venueId: venue.id,
        amountAgorot: 5000,
        status: "ACTIVE",
        qrPayload: `voucher:${rand(100000, 999999)}`,
        expiresAt: daysFromNow(90),
        createdAt: daysAgo(rand(1, 10)),
      },
    });
  }

  console.log("✓ Seeded מרפסת מלה — Full CRM:");
  console.log("  - 1 venue · 3 artists · 9 events (3 past, 6 upcoming)");
  console.log("  - 31 food menu items (starters/mains/desserts/drinks)");
  console.log("  - 12 demo users with ClubIt cards (Regular/Silver/Gold/Platinum)");
  console.log("  - 16 reservations + transactions");
  console.log("  - 9 reviews · 8 check-ins · 4 campaigns · 8 food orders · 4 vouchers");
  console.log("  Login: /venue/login → mirpeset / demo1234");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.$disconnect());
