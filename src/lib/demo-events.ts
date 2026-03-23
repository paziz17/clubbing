// נתוני דמו — מוצגים כשהמסד ריק או לא זמין (פיתוח מקומי)

function in7Days() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(22, 0, 0, 0);
  return d.toISOString();
}
function in14Days() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setHours(22, 0, 0, 0);
  return d.toISOString();
}

export const DEMO_EVENTS = [
  {
    id: "demo-1",
    venueName: "Gold Room",
    name: "Gold Room — ליל האוס",
    description:
      "Gold Room — מועדון בסגנון לופט ברוטשילד: קו אור זהוב, מערכת סאונד Martin Audio ומרפסת עישון. ערב האוס עם תורני Resident ו־Guest מחו״ל, בר קוקטיילים וכניסה מ־21.",
    date: in7Days(),
    time: "22:00",
    location: "תל אביב",
    address: "רוטשילד 22, תל אביב",
    imageUrl: "https://images.unsplash.com/photo-1571266020783-9e221f7b935d?w=800&h=600&fit=crop",
    phone: "050-1112233",
    tags: ["האוס", "מסיבה", "21+"],
    ageRestriction: "21+",
  },
  {
    id: "demo-2",
    venueName: "Basement Jaffa",
    name: "Basement Jaffa — טכנו עד הבוקר",
    description:
      "Basement Jaffa — חלל תת־קרקעי ביפו: עמודי בטון, לייזרים חד־צבעיים וסאונד חם. לילה של טכנו עם שני DJ booths, הפרדה ל־VIP ושעות פתיחה עד אור הבוקר.",
    date: in14Days(),
    time: "23:00",
    location: "תל אביב",
    address: "יפו העתיקה — כניסה צדדית (דמו)",
    imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=600&fit=crop",
    phone: "050-4445566",
    tags: ["טכנו", "מסיבה", "21+"],
    ageRestriction: "21+",
  },
];

export const DEMO_EVENTS_MAP = Object.fromEntries(DEMO_EVENTS.map((e) => [e.id, e]));
