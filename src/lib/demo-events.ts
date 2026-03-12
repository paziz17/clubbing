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
    name: "מסיבת House — Demo Club",
    description: "Demo Club — מועדון תל־אביבי עם במה מרכזית, מערכת סאונד מקצועית ומרפסת עירונית. ערב House עם DJ אורחים, בר משקאות מלא ואווירה חמה. כניסה מ־21.",
    date: in7Days(),
    time: "22:00",
    location: "תל אביב",
    address: "רחוב רוטשילד 45",
    imageUrl: "https://images.unsplash.com/photo-1764510376258-2c9978ec3e4e?w=800&h=600&fit=crop",
    phone: "050-1234567",
    tags: ["House", "מסיבה", "21+"],
    ageRestriction: "21+",
  },
  {
    id: "demo-2",
    name: "Techno Night — The Block",
    description: "The Block — מועדון תת־קרקעי ביפו עם סאונד אנלוגי, תאורה מינימליסטית ומרחב ריקוד גדול. ערב טכנו עם שני DJs, שעות פתיחה עד הבוקר.",
    date: in14Days(),
    time: "22:00",
    location: "תל אביב",
    address: "רחוב שלום 157, יפו",
    imageUrl: "https://images.unsplash.com/photo-1763630054130-0129c32d3f7f?w=800&h=600&fit=crop",
    phone: "050-7654321",
    tags: ["Techno", "מסיבה", "21+"],
    ageRestriction: "21+",
  },
];

export const DEMO_EVENTS_MAP = Object.fromEntries(DEMO_EVENTS.map((e) => [e.id, e]));
