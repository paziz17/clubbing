import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  employeeId: z.string(),
  eventId: z.string().optional().nullable(),
  role: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: z.string().default("SCHEDULED"),
  breakMinutes: z.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const venue = await requireVenue();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const where: any = { venueId: venue.id };
    if (from || to) {
      where.startsAt = {};
      if (from) where.startsAt.gte = new Date(from);
      if (to) where.startsAt.lte = new Date(to);
    }
    const shifts = await db.shift.findMany({
      where,
      include: { employee: true },
      orderBy: { startsAt: "asc" },
    });
    return NextResponse.json({ shifts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const venue = await requireVenue();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;

    const employee = await db.employee.findFirst({ where: { id: d.employeeId, venueId: venue.id } });
    if (!employee) return NextResponse.json({ error: "EMPLOYEE_NOT_FOUND" }, { status: 404 });

    const startsAt = new Date(d.startsAt);
    const endsAt = new Date(d.endsAt);
    if (endsAt <= startsAt) return NextResponse.json({ error: "INVALID_RANGE" }, { status: 400 });

    // conflict detection — overlapping shift for same employee
    const overlap = await db.shift.findFirst({
      where: {
        employeeId: d.employeeId,
        status: { not: "CANCELLED" },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (overlap) {
      return NextResponse.json(
        { error: "CONFLICT", message: "לעובד כבר יש משמרת חופפת בטווח הזה" },
        { status: 409 }
      );
    }

    const shift = await db.shift.create({
      data: {
        venueId: venue.id,
        employeeId: d.employeeId,
        eventId: d.eventId ?? null,
        role: d.role ?? employee.role,
        startsAt,
        endsAt,
        status: d.status,
        breakMinutes: d.breakMinutes,
        hourlyWageAgorot: employee.hourlyWageAgorot,
        notes: d.notes ?? null,
      },
      include: { employee: true },
    });
    return NextResponse.json({ shift });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
