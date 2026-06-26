/**
 * Seed the full menu for "מרפסת מלה" (Marpeset Mala) — split into two sections:
 *   RESTAURANT  — dishes from the official PDF menu (appetizers, japanese,
 *                 signature rolls, grill, desserts, coffee).
 *   BAR         — full alcohol catalog (market-estimated prices) + snacks
 *                 (נישנושים), shown on the bartender fast-sale POS.
 *
 * Idempotent: upserts each item by (venueId, section, name) so re-runs only
 * refresh price/category and never create duplicates.
 *
 * Run locally:  npx tsx scripts/seed-marpeset-menu.ts
 * Prices are in shekels here and converted to agorot on insert.
 */
import { db } from "../src/lib/db";

type Item = { name: string; category: string; price: number; desc?: string; prep?: number };

const RESTAURANT: Item[] = [
  // ---- מנות פתיחה (APPETIZERS) ----
  { category: "מנות פתיחה", name: "ניגירי סלמון טרטופו", price: 59, desc: "צרוב בחמאת כמהין" },
  { category: "מנות פתיחה", name: "ניגירי דג ים לבן", price: 65, desc: "טרטר טונה בלופין, וסאבי, צ'יפס כרישה" },
  { category: "מנות פתיחה", name: "קריספי רייס טונה", price: 88, desc: "ריבועי אורז סושי צרובים בחמאה, טרטר טונה, איולי צ'ילי ופוריקקה" },
  { category: "מנות פתיחה", name: "טרטר דג ים עטוף בסלק", price: 77, desc: "שקדים קלויים, בצל סגול, עשבי תיבול וקרם פרש אבוקדו" },
  { category: "מנות פתיחה", name: "פרוסות ססימי יילו טייל", price: 69, desc: "צ'ימיצ'ורי עגבניות שרופות, למון גראס, שמן זית ופונזו" },
  { category: "מנות פתיחה", name: "קוביות תפוח גרני סמית'", price: 64, desc: "קולורבי ומלפפון, בצל סגול, נענע, כוסברה, יוזו, ויניגרט חלפיניו מותסס ושמן בזיל" },
  { category: "מנות פתיחה", name: "ענבים על החצי", price: 65, desc: "גבינת מנצ'גו, בצל סגול, צנוניות, עשבי תיבול, לקט ירוקים ויוזו" },
  { category: "מנות פתיחה", name: "קיסר יפני", price: 65, desc: "לקט חסות מהשדה, בצל סגול, פנקו בטוגראשי, אצות נורי, רוטב קיסר דאשי ופרמז'ן" },
  { category: "מנות פתיחה", name: "סטייק טרטר", price: 78, desc: "פילה בקר קצוץ על הסכין, צלפים, קורנישונים, שאלוט, איולי חרדל ופוריקקה, לחם קלוי על פחם" },
  { category: "מנות פתיחה", name: "האנד רול טונה", price: 78, desc: "טונה בלופין קצוצה, ויניגרט צ'ילי מותסס עם תפוח ירוק, עלה שיסו פריך, עירית ופוריקקה" },
  { category: "מנות פתיחה", name: "ברוסקטה אינטיאס", price: 88, desc: "חציל שרוף על פחמים וטחינת שקדים" },
  // ---- יפני (JAPANESE STYLE) ----
  { category: "יפני", name: "ססימי פריסטייל", price: 168, desc: "250 גרם פרוסות דג נא מהדגה הטרייה והמובחרת" },
  { category: "יפני", name: "ניגירי פריסטייל", price: 99, desc: "6 יחידות ניגירי משלל סוגי הדגים" },
  { category: "יפני", name: "ססימי סלמון", price: 69, desc: "מוגש עם סויה קוג'י ווסאבי טרי" },
  { category: "יפני", name: "ססימי יילוטייל", price: 69, desc: "מוגש עם סויה קוג'י ווסאבי טרי" },
  { category: "יפני", name: "ססימי טונה בלופין", price: 49, desc: "מוגש עם סויה קוג'י ווסאבי טרי" },
  { category: "יפני", name: "ניגירי סלמון (2 יח')", price: 42, desc: "מוגש עם סויה קוג'י ווסאבי טרי" },
  { category: "יפני", name: "ניגירי יילוטייל (2 יח')", price: 42, desc: "מוגש עם סויה קוג'י ווסאבי טרי" },
  { category: "יפני", name: "ניגירי טונה בלופין (2 יח')", price: 33, desc: "מוגש עם סויה קוג'י ווסאבי טרי" },
  // ---- רולים (SIGNATURE ROLLS) ----
  { category: "רולים", name: "סלמון אפוי במרינדה", price: 84, desc: "אבוקדו, בצל ירוק, עטוף בסלמון צרוב, איולי צ'ילי ושקדים קלויים" },
  { category: "רולים", name: "סלמון קריס", price: 86, desc: "אבוקדו, עירית, עטוף סלמון על קרם פרש יוזו" },
  { category: "רולים", name: "ספיישל דג ים משתנה", price: 89, desc: "120 גרם, אבוקדו, קנפיו, עטוף במיקס דגים, איולי יוזו, בצל ירוק וסויה קוג'י" },
  { category: "רולים", name: "פוטומאקי זוקיני בטמפורה", price: 67, desc: "אבוקדו, עירית, סלנובה וקמפיו עם איולי נענע וטריאקי" },
  { category: "רולים", name: "פוטומאקי סלמון ואיקורה", price: 77, desc: "אבוקדו, מלפפון, לקט עלים ואיולי וסאבי" },
  { category: "רולים", name: "טרטר ספייסי טונה", price: 89, desc: "120 גרם, מלפפון, קנפיו, עטוף בטונה איולי צ'ילי ומסאגו אררה" },
  { category: "רולים", name: "ססימאקי", price: 79, desc: "סלמון, טונה, ילו טייל (120 גרם), אבוקדו וסלנובה עטופים בנורי ומלפפון מגולף" },
  { category: "רולים", name: "גרין רול", price: 86, desc: "טונה בלופין, אבוקדו, מלפפון, עירית, לקט עלים בפונזו ואיולי נענע" },
  // ---- גריל (GRILL) ----
  { category: "גריל", name: "שיפוד פטריות", price: 73, desc: "על גריל פחמים, אספרגוס, קרם תירס ומנצ'גו" },
  { category: "גריל", name: "שיפוד סלמון", price: 89, desc: "על גריל פחמים, חמאת מיסו וקרם תפוח אדמה" },
  { category: "גריל", name: "שיפוד פילה בקר", price: 116, desc: "קרם ארטישוק ירושלמי, באקצ'ויי, פטריית מלך היער" },
  { category: "גריל", name: "שיפוד נאם טוק", price: 122, desc: "דפי אנטריקוט על פחם, נענע, כוסברה ושאלוט ברוטב נאם טוק תאילנדי חריף, קרם שורשים בקוקוס וקפיר ליים" },
  { category: "גריל", name: "פילה בר ים", price: 158, desc: "160 גרם, ירקות ירוקים, עגבניות שרי, תרד, עשבים, חמאה וציר דאשי" },
  { category: "גריל", name: "סטייק אנטריקוט ריו פלטנסה (ל-100 גרם)", price: 76, desc: "מיושן 30 ימים, תפו\"א אפויים בטוגראשי" },
  // ---- קינוחים (DESSERTS) ----
  { category: "קינוחים", name: "שוקולד קפה", price: 65, desc: "מצע פייטה של פקאן, מוס שוקולד אוורירי, קציפת קפה ושבבי שוקולד קריספיים" },
  { category: "קינוחים", name: "קרמו שוקולד לבן ג'ינגר", price: 65, desc: "קראמבל חלב, קרמו שוקולד לבן ג'ינגר יוזו וליים, טווייל כוסברה ומרמלדת מנגו פסיפלורה" },
  { category: "קינוחים", name: "פנקוטה כוסברה", price: 65, desc: "רוטב פירות יער וטווייל תחרה שומשום שחור" },
  { category: "קינוחים", name: "פיסטוק לימון", price: 65, desc: "עוגת שקדים ופיסטוק, קרם לימון חמצמץ ומרמלדת מנגו פסיפלורה" },
  // ---- קפה ----
  { category: "קפה", name: "אספרסו קצר", price: 12, prep: 3 },
  { category: "קפה", name: "אספרסו כפול", price: 14, prep: 3 },
];

const BAR: Item[] = [
  // ---- בירות ----
  { category: "בירות", name: "טובורג (חצי ליטר)", price: 30, prep: 1 },
  { category: "בירות", name: "קרלסברג", price: 32, prep: 1 },
  { category: "בירות", name: "הייניקן", price: 34, prep: 1 },
  { category: "בירות", name: "קורונה", price: 34, prep: 1 },
  { category: "בירות", name: "1664 בלאן", price: 36, prep: 1 },
  { category: "בירות", name: "וויהנשטפן (חיטה)", price: 38, prep: 1 },
  { category: "בירות", name: "גינס דראפט", price: 40, prep: 1 },
  // ---- קוקטיילים ----
  { category: "קוקטיילים", name: "מוחיטו", price: 52, prep: 4 },
  { category: "קוקטיילים", name: "אספרסו מרטיני", price: 56, prep: 4 },
  { category: "קוקטיילים", name: "נגרוני", price: 56, prep: 4 },
  { category: "קוקטיילים", name: "מרגריטה", price: 54, prep: 4 },
  { category: "קוקטיילים", name: "אולד פאשנד", price: 58, prep: 4 },
  { category: "קוקטיילים", name: "אפרול שפריץ", price: 52, prep: 3 },
  { category: "קוקטיילים", name: "פינה קולדה", price: 52, prep: 4 },
  { category: "קוקטיילים", name: "קוסמופוליטן", price: 54, prep: 4 },
  { category: "קוקטיילים", name: "מוסקו מיול", price: 50, prep: 3 },
  { category: "קוקטיילים", name: "דאקירי", price: 52, prep: 4 },
  // ---- וויסקי ----
  { category: "וויסקי", name: "ג'יימסון", price: 38, prep: 1 },
  { category: "וויסקי", name: "ג'ק דניאלס", price: 38, prep: 1 },
  { category: "וויסקי", name: "בושמילס", price: 38, prep: 1 },
  { category: "וויסקי", name: "שיבאס ריגל 12", price: 42, prep: 1 },
  { category: "וויסקי", name: "ג'וני ווקר בלאק לייבל", price: 46, prep: 1 },
  { category: "וויסקי", name: "גלנפידיק 12", price: 52, prep: 1 },
  { category: "וויסקי", name: "מקאלאן 12", price: 70, prep: 1 },
  // ---- וודקה ----
  { category: "וודקה", name: "סטוליצ'ניה", price: 34, prep: 1 },
  { category: "וודקה", name: "אבסולוט", price: 36, prep: 1 },
  { category: "וודקה", name: "קטל וואן", price: 44, prep: 1 },
  { category: "וודקה", name: "בלוודר", price: 46, prep: 1 },
  { category: "וודקה", name: "גריי גוס", price: 48, prep: 1 },
  // ---- ג'ין ----
  { category: "ג'ין", name: "גורדונס", price: 34, prep: 1 },
  { category: "ג'ין", name: "בומביי ספיר", price: 42, prep: 1 },
  { category: "ג'ין", name: "טנקרי", price: 44, prep: 1 },
  { category: "ג'ין", name: "הנדריקס", price: 52, prep: 1 },
  // ---- רום ----
  { category: "רום", name: "בקרדי", price: 36, prep: 1 },
  { category: "רום", name: "קפטן מורגן", price: 38, prep: 1 },
  { category: "רום", name: "הוואנה קלאב 7", price: 44, prep: 1 },
  // ---- טקילה ----
  { category: "טקילה", name: "חוסה קוארבו", price: 38, prep: 1 },
  { category: "טקילה", name: "פטרון סילבר", price: 56, prep: 1 },
  { category: "טקילה", name: "דון חוליו בלאנקו", price: 60, prep: 1 },
  // ---- ליקרים וערק ----
  { category: "ליקרים וערק", name: "ערק עלית", price: 28, prep: 1 },
  { category: "ליקרים וערק", name: "אוזו", price: 32, prep: 1 },
  { category: "ליקרים וערק", name: "לימונצ'לו", price: 32, prep: 1 },
  { category: "ליקרים וערק", name: "אפרול", price: 32, prep: 1 },
  { category: "ליקרים וערק", name: "קמפרי", price: 34, prep: 1 },
  { category: "ליקרים וערק", name: "יגרמייסטר", price: 34, prep: 1 },
  { category: "ליקרים וערק", name: "בייליס", price: 34, prep: 1 },
  // ---- יין ----
  { category: "יין", name: "יין הבית אדום (כוס)", price: 36, prep: 1 },
  { category: "יין", name: "יין הבית לבן (כוס)", price: 36, prep: 1 },
  { category: "יין", name: "פרוסקו (כוס)", price: 38, prep: 1 },
  { category: "יין", name: "שמפניה (כוס)", price: 48, prep: 1 },
  // ---- נישנושים (snacks under the bar) ----
  { category: "נישנושים", name: "צ'יפס קלאסי + איולי", price: 30, prep: 8 },
  { category: "נישנושים", name: "צ'יפס בטטה", price: 32, prep: 8 },
  { category: "נישנושים", name: "אצבעות מוצרלה", price: 38, prep: 8 },
  { category: "נישנושים", name: "כנפיים פיקנטיות", price: 46, prep: 10 },
  { category: "נישנושים", name: "נאצ'וס גבינה וסלסה", price: 42, prep: 8 },
  { category: "נישנושים", name: "שניצלונים", price: 42, prep: 10 },
  { category: "נישנושים", name: "מבחר גבינות וקרקרים", price: 48, prep: 5 },
  { category: "נישנושים", name: "חומוס עם פיתה", price: 32, prep: 5 },
  { category: "נישנושים", name: "אדממה", price: 28, prep: 5 },
  { category: "נישנושים", name: "אגוזים מתובלים", price: 22, prep: 1 },
  { category: "נישנושים", name: "זיתים מתובלים", price: 18, prep: 1 },
  { category: "נישנושים", name: "פירות העונה", price: 28, prep: 5 },
];

async function findVenue() {
  const needles = ["מרפסת", "מלה", "marpeset", "mala"];
  const venues = await db.venue.findMany({ select: { id: true, name: true } });
  const match = venues.find((v) =>
    needles.some((n) => v.name.toLowerCase().includes(n.toLowerCase()))
  );
  if (!match) {
    console.error("❌ Venue 'מרפסת מלה' not found. Available venues:");
    venues.forEach((v) => console.error(`   - ${v.name} (${v.id})`));
    process.exit(1);
  }
  return match;
}

async function upsertItem(venueId: string, section: "RESTAURANT" | "BAR", it: Item) {
  const existing = await db.foodMenuItem.findFirst({
    where: { venueId, section, name: it.name },
    select: { id: true },
  });
  const data = {
    section,
    category: it.category,
    priceAgorot: Math.round(it.price * 100),
    description: it.desc ?? null,
    prepMinutes: it.prep ?? 15,
    active: true,
  };
  if (existing) {
    await db.foodMenuItem.update({ where: { id: existing.id }, data });
    return "updated";
  }
  await db.foodMenuItem.create({ data: { venueId, name: it.name, ...data } });
  return "created";
}

async function main() {
  const venue = await findVenue();
  console.log(`▶ Seeding menu for: ${venue.name} (${venue.id})`);
  let created = 0;
  let updated = 0;
  for (const it of RESTAURANT) {
    (await upsertItem(venue.id, "RESTAURANT", it)) === "created" ? created++ : updated++;
  }
  for (const it of BAR) {
    (await upsertItem(venue.id, "BAR", it)) === "created" ? created++ : updated++;
  }
  const counts = await db.foodMenuItem.groupBy({
    by: ["section"],
    where: { venueId: venue.id },
    _count: true,
  });
  console.log(`✅ Done. created=${created}, updated=${updated}`);
  counts.forEach((c) => console.log(`   ${c.section}: ${c._count} items`));
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
