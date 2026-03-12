import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// מועדון דמו — שם משתמש וסיסמה: Demo Club
const DEMO_VENUE_NAME = "Demo Club";
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
  await prisma.reservation.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.venue.deleteMany({});

  const venue = await prisma.venue.create({
    data: {
      name: DEMO_VENUE_NAME,
      passwordHash: hashPassword(DEMO_VENUE_NAME),
    },
  });

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
      venueId: venue.id,
    },
  });

  console.log("Seeded 1 venue (Demo Club) + 1 demo event — CRM: login with 'Demo Club' / 'Demo Club'");
}

const isCli = process.argv[1]?.includes("seed");
if (isCli) {
  runSeed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
