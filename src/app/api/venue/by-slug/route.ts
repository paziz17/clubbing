import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ venue: null });

  const venue = await db.venue.findFirst({
    where: {
      OR: [
        { slug },
        { username: slug },
        { slug: { contains: slug } },
      ],
    },
    select: { name: true, logoUrl: true, city: true, slug: true, username: true },
  });
  return NextResponse.json({ venue: venue ?? null });
}
