import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venues = await db.venue.findMany({
    include: {
      _count: { select: { events: true, reservations: true, transactions: true, reviews: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ venues });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, username, password, logoUrl, address, city } = await req.json();
  if (!name || !slug || !username || !password)
    return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });

  const exists = await db.venue.findFirst({ where: { OR: [{ slug }, { username }] } });
  if (exists)
    return NextResponse.json({ error: "Slug או שם משתמש כבר קיים" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const venue = await db.venue.create({
    data: {
      name, slug, username, passwordHash,
      logoUrl: logoUrl || null,
      address: address || slug,
      city: city || "ישראל",
    },
  });
  return NextResponse.json({ ok: true, venueId: venue.id });
}
