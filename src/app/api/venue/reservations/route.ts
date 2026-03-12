import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVenueId } from "@/lib/venue-auth";

export async function GET() {
  const venueId = await getVenueId();
  if (!venueId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { event: { venueId } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      event: { select: { id: true, name: true, date: true } },
    },
  });

  return NextResponse.json(reservations);
}
