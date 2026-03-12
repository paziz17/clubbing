import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVenueId } from "@/lib/venue-auth";
import { DEMO_EVENTS_MAP } from "@/lib/demo-events";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const venueId = await getVenueId();
  if (!venueId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const { id } = await params;

  if (venueId === "demo-venue-1" && id === "demo-1") {
    const e = DEMO_EVENTS_MAP["demo-1"];
    return NextResponse.json({ ...e, reservations: [] });
  }
  if (venueId === "demo-venue-2" && id === "demo-2") {
    const e = DEMO_EVENTS_MAP["demo-2"];
    return NextResponse.json({ ...e, reservations: [] });
  }

  const event = await prisma.event.findFirst({
    where: { id, venueId },
    include: {
      reservations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(event);
}
