import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVenueId } from "@/lib/venue-auth";

export async function GET() {
  const venueId = await getVenueId();
  if (!venueId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: { venueId },
    orderBy: { date: "desc" },
    include: {
      _count: { select: { reservations: true } },
      reservations: { select: { numPeople: true } },
    },
  });

  const eventsWithStats = events.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    date: e.date,
    time: e.time,
    location: e.location,
    address: e.address,
    phone: e.phone,
    imageUrl: e.imageUrl,
    status: e.status,
    reservationsCount: e._count.reservations,
    totalPeople: e.reservations.reduce((s, r) => s + r.numPeople, 0),
  }));

  return NextResponse.json(eventsWithStats);
}
