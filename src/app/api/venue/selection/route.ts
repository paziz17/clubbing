import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const venue = await requireVenue();
  const { appId, status, reason } = await req.json();
  const app = await db.exclusiveApplication.update({
    where: { id: appId, venueId: venue.id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? reason || null : null,
      decidedAt: new Date(),
    },
  });
  return NextResponse.json({ app });
}
