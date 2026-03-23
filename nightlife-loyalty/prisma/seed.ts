import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.club.count();
  if (count >= 2) {
    console.log("Clubs already seeded");
    return;
  }

  await prisma.club.createMany({
    data: [
      {
        name: "מועדון הלילה",
        location: "תל אביב, רחוב רוטשילד 50",
        earnRate: 0.05,
        expirationDays: 30,
        minRedeem: 10,
        tierThresholds: JSON.stringify({
          Light: { visits: 0, spend: 0 },
          Regular: { visits: 2, spend: 500 },
          Heavy: { visits: 5, spend: 2000 },
          VIP: { visits: 10, spend: 5000 },
        }),
      },
      {
        name: "הבאר התת-קרקעי",
        location: "תל אביב, רחוב דיזנגוף 100",
        earnRate: 0.05,
        expirationDays: 30,
        tierThresholds: JSON.stringify({
          Light: { visits: 0, spend: 0 },
          Regular: { visits: 2, spend: 400 },
          Heavy: { visits: 4, spend: 1500 },
          VIP: { visits: 8, spend: 4000 },
        }),
      },
    ],
  });

  console.log("Seeded 2 clubs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
