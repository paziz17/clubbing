import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const venue = await requireVenue();
  const body = await req.json();
  const review = await db.venueReview.update({
    where: { id, venueId: venue.id },
    data: { crmStatus: body.crmStatus },
  });
  return NextResponse.json({ review });
}
