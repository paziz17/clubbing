import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  role: z.string().default("WAITER"),
  hourlyWageAgorot: z.number().int().min(0).default(4000),
  color: z.string().default("#D4AF37"),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const venue = await requireVenue();
    const employees = await db.employee.findMany({
      where: { venueId: venue.id },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
    return NextResponse.json({ employees });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const venue = await requireVenue();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const employee = await db.employee.create({
      data: { venueId: venue.id, ...parsed.data },
    });
    return NextResponse.json({ employee });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
