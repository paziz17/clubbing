import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireVenue } from "@/lib/venue-session";

export async function GET(req: NextRequest) {
  const venue = await requireVenue();
  const dayStart = new Date();
  dayStart.setHours(18, 0, 0, 0);
  if (dayStart > new Date()) dayStart.setDate(dayStart.getDate() - 1);

  const txns = await db.transaction.findMany({
    where: { venueId: venue.id, createdAt: { gte: dayStart }, status: "PAID" },
  });
  const verified = await db.reservation.count({
    where: {
      venueId: venue.id,
      status: "PAID",
      checkedInAt: { gte: dayStart },
    },
  });
  const recent = await db.reservation.findMany({
    where: { venueId: venue.id, createdAt: { gte: dayStart } },
    include: { user: true, event: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    verified,
    revenue: txns.reduce((s, t) => s + Math.max(0, t.amountAgorot), 0),
    creditsTonight: txns.reduce((s, t) => s + Math.max(0, t.creditsDelta), 0),
    recent: recent.map((r) => ({
      id: r.id,
      userName: r.user?.name,
      guestName: r.guestName,
      totalAgorot: r.totalAgorot,
      creditsEarned: r.creditsEarned,
      eventName: r.event.name,
    })),
  });
}
