import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const [reservations, totalPeople, eventsWithReservations, totalEvents] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.aggregate({ _sum: { numPeople: true } }),
    prisma.reservation.groupBy({
      by: ["eventId"],
      _count: { id: true },
      _sum: { numPeople: true },
    }),
    prisma.event.count(),
  ]);

  const eventDetails = await prisma.event.findMany({
    where: { id: { in: eventsWithReservations.map((e) => e.eventId) } },
    select: { id: true, name: true, date: true },
  });

  const eventMap = Object.fromEntries(eventDetails.map((e) => [e.id, e]));

  const byEvent = eventsWithReservations.map((e) => ({
    eventId: e.eventId,
    eventName: eventMap[e.eventId]?.name ?? "אירוע",
    eventDate: eventMap[e.eventId]?.date,
    reservations: e._count.id,
    totalPeople: e._sum.numPeople ?? 0,
  }));

  return NextResponse.json({
    totalReservations: reservations,
    totalPeople: totalPeople._sum.numPeople ?? 0,
    totalEvents,
    byEvent: byEvent.sort((a, b) => (b.eventDate?.getTime() ?? 0) - (a.eventDate?.getTime() ?? 0)),
  });
}
