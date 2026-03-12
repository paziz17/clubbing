import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

interface DemoVenue {
  name: string;
  loginName: string;
  password: string;
  event: {
    name: string;
    description: string;
    location: string;
    address: string;
    tags: string[];
    imageUrl: string;
    phone: string;
  };
}

const DEMO_VENUES: DemoVenue[] = [
  {
    name: "Demo Club",
    loginName: "democlub",
    password: "demo123",
    event: {
      name: "מסיבת House — Demo Club",
      description: "Demo Club — מועדון תל־אביבי עם במה מרכזית, מערכת סאונד מקצועית ומרפסת עירונית. ערב House עם DJ אורחים, בר משקאות מלא ואווירה חמה. כניסה מ־21.",
      location: "תל אביב",
      address: "רחוב רוטשילד 45",
      tags: ["House", "מסיבה", "21+"],
      imageUrl: "https://images.unsplash.com/photo-1764510376258-2c9978ec3e4e?w=800&h=600&fit=crop",
      phone: "050-1234567",
    },
  },
  {
    name: "The Block",
    loginName: "theblock",
    password: "block123",
    event: {
      name: "Techno Night — The Block",
      description: "The Block — מועדון תת־קרקעי ביפו עם סאונד אנלוגי, תאורה מינימליסטית ומרחב ריקוד גדול. ערב טכנו עם שני DJs, שעות פתיחה עד הבוקר.",
      location: "תל אביב",
      address: "רחוב שלום 157, יפו",
      tags: ["Techno", "מסיבה", "21+"],
      imageUrl: "https://images.unsplash.com/photo-1763630054130-0129c32d3f7f?w=800&h=600&fit=crop",
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
        loginName: v.loginName,
        passwordHash: hashPassword(v.password),
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
    `Seeded ${DEMO_VENUES.length} venues. CRM: democlub/demo123 | theblock/block123`
  );
}

const isCli = process.argv[1]?.includes("seed");
if (isCli) {
  runSeed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
