import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// אירוע דמו יחיד — מתחבר ל-CRM
const DEMO_EVENT = {
  name: "Demo Club — מסיבת הדגמה",
  description: "מועדון הדמו להצגת המערכת. הזמנות יופיעו ב-CRM של בעלי המועדונים.",
  location: "תל אביב",
  address: "רחוב רוטשילד 45",
  tags: ["House", "מסיבה", "21+"],
  imageUrl: "https://images.unsplash.com/photo-1571266028243-d220e8c3c9e2?w=400&h=300&fit=crop",
  phone: "050-1234567",
};

export async function runSeed() {
  // מחיקת כל האירועים וההזמנות
  await prisma.reservation.deleteMany({});
  await prisma.event.deleteMany({});

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 7);
  eventDate.setHours(22, 0, 0, 0);

  await prisma.event.create({
    data: {
      name: DEMO_EVENT.name,
      description: DEMO_EVENT.description,
      date: eventDate,
      time: "22:00",
      location: DEMO_EVENT.location,
      address: DEMO_EVENT.address,
      lat: 32.0808,
      lng: 34.7805,
      imageUrl: DEMO_EVENT.imageUrl,
      ticketLink: null,
      phone: DEMO_EVENT.phone,
      ageRestriction: "21+",
      tags: JSON.stringify(DEMO_EVENT.tags),
      status: "approved",
    },
  });

  console.log("Seeded 1 demo event — connected to CRM");
}

// הרצה מהטרמינל: npx tsx prisma/seed.ts
const isCli = process.argv[1]?.includes("seed");
if (isCli) {
  runSeed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
