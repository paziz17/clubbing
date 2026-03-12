import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";
import { DEMO_EVENTS } from "@/lib/demo-events";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "desc" },
      include: {
        _count: { select: { reservations: true } },
        reservations: {
          select: { numPeople: true },
        },
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
      venueId: e.venueId,
      reservationsCount: e._count.reservations,
      totalPeople: e.reservations.reduce((s, r) => s + r.numPeople, 0),
    }));

    return NextResponse.json(eventsWithStats);
  } catch {
    return NextResponse.json(
      DEMO_EVENTS.map((e, i) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        date: e.date,
        time: e.time,
        location: e.location,
        address: e.address,
        phone: e.phone,
        imageUrl: e.imageUrl,
        status: "approved",
        venueId: `demo-venue-${i + 1}`,
        reservationsCount: 0,
        totalPeople: 0,
      })),
      { status: 200 }
    );
  }
}
