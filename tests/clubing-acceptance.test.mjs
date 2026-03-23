#!/usr/bin/env node
/**
 * Clubing — בדיקת קבלה
 * בודק את המערכת לפי אפיון גרסה 1.0
 *
 * הרצה: npm run test
 * דרוש: שרת רץ (npm run dev)
 */

const BASE = process.env.TEST_BASE_URL || "http://localhost:3003";
let passed = 0;
let failed = 0;

function log(msg, ok) {
  const icon = ok ? "✓" : "✗";
  const color = ok ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}${icon}\x1b[0m ${msg}`);
  if (ok) passed++;
  else failed++;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return { res, data };
}

async function runTests() {
  console.log("\n=== Clubing — בדיקת קבלה ===\n");

  let eventId;

  // 1. רשימת אירועים
  try {
    const { res, data } = await fetchJson(`${BASE}/api/events`);
    const isArray = Array.isArray(data);
    const hasEvents = isArray && data.length > 0;
    log("1. GET /api/events — רשימת אירועים", res.ok && isArray);
    if (hasEvents) eventId = data[0].id;
  } catch (e) {
    log("1. רשימת אירועים — " + e.message, false);
  }

  // 2. סינון לפי אזור
  try {
    const { res, data } = await fetchJson(`${BASE}/api/events?region=תל אביב`);
    const isArray = Array.isArray(data);
    const allInRegion = isArray && data.every((e) => e.location?.includes("תל אביב"));
    log("2. סינון לפי אזור (region)", res.ok && (data.length === 0 || allInRegion));
  } catch (e) {
    log("2. סינון אזור — " + e.message, false);
  }

  // 3. סינון לפי מוזיקה
  try {
    const { res, data } = await fetchJson(`${BASE}/api/events?music=House`);
    const isArray = Array.isArray(data);
    log("3. סינון לפי מוזיקה (music)", res.ok && isArray);
  } catch (e) {
    log("3. סינון מוזיקה — " + e.message, false);
  }

  // 4. פרטי אירוע בודד
  if (eventId) {
    try {
      const { res, data } = await fetchJson(`${BASE}/api/events/${eventId}`);
      const hasDetails = res.ok && data.name && data.location;
      log("4. GET /api/events/:id — פרטי אירוע", hasDetails);
    } catch (e) {
      log("4. פרטי אירוע — " + e.message, false);
    }
  } else {
    log("4. פרטי אירוע — חסר eventId", false);
  }

  // 5. יצירת אירוע
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const { res, data } = await fetchJson(`${BASE}/api/events/create`, {
      method: "POST",
      body: JSON.stringify({
        name: "טסט אירוע",
        date: futureDate.toISOString(),
        time: "22:00",
        location: "תל אביב",
        address: "רחוב טסט 1",
        description: "אירוע לבדיקה",
        ticketLink: "https://example.com",
        tags: ["House", "21+"],
      }),
    });
    log("5. POST /api/events/create — יצירת אירוע", res.ok && data.id);
  } catch (e) {
    log("5. יצירת אירוע — " + e.message, false);
  }

  // 6. ולידציה — חסרים שדות חובה
  try {
    const { res } = await fetchJson(`${BASE}/api/events/create`, {
      method: "POST",
      body: JSON.stringify({ name: "רק שם" }),
    });
    log("6. ולידציה — דחיית אירוע חסר", res.status === 400);
  } catch (e) {
    log("6. ולידציה — " + e.message, false);
  }

  // 7. יצירת משתמש
  try {
    const { res, data } = await fetchJson(`${BASE}/api/users`, {
      method: "POST",
      body: JSON.stringify({
        name: "משתמש טסט",
        age: 25,
        location: "תל אביב",
        gender: "male",
      }),
    });
    log("7. POST /api/users — יצירת משתמש", res.ok && data.id);
  } catch (e) {
    log("7. יצירת משתמש — " + e.message, false);
  }

  // 8. שמירת העדפות
  try {
    const { res: userRes, data: userData } = await fetchJson(`${BASE}/api/users`, {
      method: "POST",
      body: JSON.stringify({ name: "פרף טסט", age: 22 }),
    });
    const userId = userData?.id;
    if (userId) {
      const { res: prefRes } = await fetchJson(`${BASE}/api/preferences`, {
        method: "POST",
        body: JSON.stringify({
          userId,
          musicTypes: ["House", "Techno"],
          eventTypes: ["בר", "מסיבה"],
          ageRange: "21-25",
          region: "תל אביב",
        }),
      });
      log("8. POST /api/preferences — שמירת העדפות", prefRes.ok);
    } else {
      log("8. העדפות — חסר userId", false);
    }
  } catch (e) {
    log("8. העדפות — " + e.message, false);
  }

  console.log("\n--- סיכום ---");
  console.log(`\x1b[32mעבר: ${passed}\x1b[0m | \x1b[31mנכשל: ${failed}\x1b[0m\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("שגיאה:", e.message);
  process.exit(1);
});
