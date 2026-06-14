import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

async function guard() {
  return getAdminSession();
}

// GET — list every venue (CRM) with high-level counts for the platform table.
export async function GET() {
  if (!(await guard()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venues = await db.venue.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      username: true,
      city: true,
      address: true,
      logoUrl: true,
      _count: {
        select: {
          events: true,
          reservations: true,
          transactions: true,
          reviews: true,
        },
      },
    },
  });

  return NextResponse.json({ venues });
}

// POST — provision a brand-new CRM (venue + master OWNER credentials + settings).
export async function POST(req: NextRequest) {
  if (!(await guard()))
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ ok: false, error: "גוף בקשה שגוי" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const city = String(body.city ?? "").trim();
  const address = String(body.address ?? "").trim();
  const logoUrl = String(body.logoUrl ?? "").trim() || null;

  if (!name || !slug || !username || password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "חסרים שדות חובה (שם, subdomain, משתמש, סיסמה 6+ תווים)" },
      { status: 400 }
    );
  }

  const [slugTaken, userTaken] = await Promise.all([
    db.venue.findUnique({ where: { slug }, select: { id: true } }),
    db.venue.findUnique({ where: { username }, select: { id: true } }),
  ]);
  if (slugTaken)
    return NextResponse.json({ ok: false, error: "ה-subdomain כבר תפוס" }, { status: 409 });
  if (userTaken)
    return NextResponse.json({ ok: false, error: "שם המשתמש כבר תפוס" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  const venue = await db.venue.create({
    data: {
      name,
      slug,
      username,
      passwordHash,
      city: city || "—",
      address: address || "—",
      logoUrl,
      settings: { create: {} },
    },
    select: { id: true, slug: true, name: true },
  });

  return NextResponse.json({ ok: true, venue });
}
