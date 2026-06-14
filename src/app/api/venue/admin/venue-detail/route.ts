import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

// GET ?id= — full drawer payload for a single venue (recent events + reservations).
export async function GET(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const venue = await db.venue.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      username: true,
      city: true,
      address: true,
      logoUrl: true,
      _count: {
        select: { events: true, reservations: true, transactions: true, reviews: true },
      },
      events: {
        orderBy: { startsAt: "desc" },
        take: 6,
        select: { id: true, name: true, startsAt: true, basePriceAgorot: true, status: true },
      },
      reservations: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, guestName: true, quantity: true, status: true, createdAt: true },
      },
    },
  });

  if (!venue) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ venue });
}
