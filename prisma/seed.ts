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
    name: "Gold Room TLV",
    loginName: "goldroom",
    password: "club123",
    event: {
      name: "Gold Room — ליל האוס",
      description:
        "Gold Room — מועדון בסגנון לופט ברוטשילד: קו אור זהוב, מערכת סאונד Martin Audio ומרפסת עישון. ערב האוס עם תורני Resident ו־Guest מחו״ל, בר קוקטיילים וכניסה מ־21.",
      location: "תל אביב",
      address: "רוטשילד 22, תל אביב",
      tags: ["האוס", "מסיבה", "21+"],
      imageUrl: "https://images.unsplash.com/photo-1571266020783-9e221f7b935d?w=800&h=600&fit=crop",
      phone: "050-1112233",
    },
  },
  {
    name: "Basement Jaffa",
    loginName: "basementjaffa",
    password: "club123",
    event: {
      name: "Basement Jaffa — טכנו עד הבוקר",
      description:
        "Basement Jaffa — חלל תת־קרקעי ביפו: עמודי בטון, לייזרים חד־צבעיים וסאונד חם. לילה של טכנו עם שני DJ booths, הפרדה ל־VIP ושעות פתיחה עד אור הבוקר.",
      location: "תל אביב",
      address: "יפו העתיקה — כניסה צדדית (דמו)",
      tags: ["טכנו", "מסיבה", "21+"],
      imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=600&fit=crop",
      phone: "050-4445566",
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
        time: i === 0 ? "22:00" : "23:00",
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
    `Seeded ${DEMO_VENUES.length} venues. CRM: goldroom/club123 | basementjaffa/club123`
  );
}

const isCli = process.argv[1]?.includes("seed");
if (isCli) {
  runSeed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
