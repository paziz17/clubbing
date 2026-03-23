import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });

  if (clubs.length < 2) {
    return NextResponse.json({
      error: "נדרשים לפחות 2 מועדונים",
      clubs: clubs,
    });
  }

  return NextResponse.json(
    clubs.map((c) => ({
      id: c.id,
      name: c.name,
      location: c.location,
      earnRate: c.earnRate,
      expirationDays: c.expirationDays,
    }))
  );
}
