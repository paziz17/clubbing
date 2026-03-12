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
    name: "Demo Club — מסיבת הדגמה",
    description: "מועדון הדמו להצגת המערכת. הזמנות יופיעו ב-CRM של בעלי המועדונים.",
    date: in7Days(),
    time: "22:00",
    location: "תל אביב",
    address: "רחוב רוטשילד 45",
    imageUrl: "https://images.unsplash.com/photo-1571266028243-d220e8c3c9e2?w=400&h=300&fit=crop",
    phone: "050-1234567",
    tags: ["House", "מסיבה", "21+"],
    ageRestriction: "21+",
  },
  {
    id: "demo-2",
    name: "The Block — Techno Night",
    description: "ערב טכנו במועדון The Block. CRM נפרד לבעל המועדון.",
    date: in14Days(),
    time: "22:00",
    location: "תל אביב",
    address: "רחוב שלום 157, יפו",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
    phone: "050-7654321",
    tags: ["Techno", "מסיבה", "21+"],
    ageRestriction: "21+",
  },
];

export const DEMO_EVENTS_MAP = Object.fromEntries(DEMO_EVENTS.map((e) => [e.id, e]));
