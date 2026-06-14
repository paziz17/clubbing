import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const venue = await db.venue.findUnique({
    where: { id },
    include: {
      events: { orderBy: { startsAt: "desc" }, take: 5, select: { id: true, name: true, startsAt: true, basePriceAgorot: true, status: true } },
      reservations: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, guestName: true, quantity: true, status: true, createdAt: true } },
      _count: { select: { events: true, reservations: true, transactions: true, reviews: true } },
    },
  });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ venue });
}
