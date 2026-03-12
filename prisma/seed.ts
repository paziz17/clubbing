import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const DEMO_VENUES = [
  {
    name: "Demo Club",
    event: {
      name: "Demo Club — מסיבת הדגמה",
      description: "מועדון הדמו להצגת המערכת. הזמנות יופיעו ב-CRM של בעלי המועדונים.",
      location: "תל אביב",
      address: "רחוב רוטשילד 45",
      tags: ["House", "מסיבה", "21+"],
      imageUrl: "https://images.unsplash.com/photo-1571266028243-d220e8c3c9e2?w=400&h=300&fit=crop",
      phone: "050-1234567",
    },
  },
  {
    name: "The Block",
    event: {
      name: "The Block — Techno Night",
      description: "ערב טכנו במועדון The Block. CRM נפרד לבעל המועדון.",
      location: "תל אביב",
      address: "רחוב שלום 157, יפו",
      tags: ["Techno", "מסיבה", "21+"],
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
      phone: "050-7654321",
    },
  },
];

export async function runSeed() {
  await prisma.reservation.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.venue.deleteMany({});

  for (let i = 0; i < DEMO_VENUES.length; i++) {
    const v = DEMO_VENUES[i];
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7 + i * 7);
    eventDate.setHours(22, 0, 0, 0);
    const venue = await prisma.venue.create({
      data: {
        name: v.name,
        passwordHash: hashPassword(v.name),
      },
    });

    const e = v.event;
    await prisma.event.create({
      data: {
        name: e.name,
        description: e.description,
        date: eventDate,
        time: "22:00",
        location: e.location,
        address: e.address,
        lat: 32.0808,
        lng: 34.7805,
        imageUrl: e.imageUrl,
        ticketLink: null,
        phone: e.phone,
        ageRestriction: "21+",
        tags: JSON.stringify(e.tags),
        status: "approved",
        venueId: venue.id,
      },
    });
  }

  console.log(
    `Seeded ${DEMO_VENUES.length} venues: ${DEMO_VENUES.map((v) => `"${v.name}"`).join(", ")} — CRM: login with venue name / venue name`
  );
}

const isCli = process.argv[1]?.includes("seed");
if (isCli) {
  runSeed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
