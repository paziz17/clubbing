import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

// Cross-venue operations summary for the general (super-admin) CRM:
// weekly labor cost from shifts + inventory value + low-stock alerts per venue.
export async function GET() {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [venues, shifts, items, activeEmployees] = await Promise.all([
    db.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.shift.findMany({
      where: { startsAt: { gte: weekStart, lt: weekEnd }, status: { not: "CANCELLED" } },
      select: { venueId: true, startsAt: true, endsAt: true, breakMinutes: true, hourlyWageAgorot: true },
    }),
    db.inventoryItem.findMany({
      where: { active: true },
      select: { venueId: true, stockQty: true, parLevel: true, unitCostAgorot: true },
    }),
    db.employee.groupBy({ by: ["venueId"], where: { active: true }, _count: true }),
  ]);

  const empByVenue = new Map(activeEmployees.map((e) => [e.venueId, e._count]));

  const rows = venues.map((v) => {
    const vShifts = shifts.filter((s) => s.venueId === v.id);
    const laborAgorot = vShifts.reduce((sum, s) => {
      const hrs = Math.max(0, (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 3600000 - (s.breakMinutes || 0) / 60);
      return sum + hrs * s.hourlyWageAgorot;
    }, 0);
    const vItems = items.filter((i) => i.venueId === v.id);
    const inventoryValueAgorot = vItems.reduce((sum, i) => sum + i.stockQty * i.unitCostAgorot, 0);
    const lowStock = vItems.filter((i) => i.parLevel > 0 && i.stockQty <= i.parLevel).length;
    return {
      venueId: v.id,
      name: v.name,
      employees: empByVenue.get(v.id) ?? 0,
      shifts: vShifts.length,
      laborAgorot: Math.round(laborAgorot),
      inventoryItems: vItems.length,
      inventoryValueAgorot: Math.round(inventoryValueAgorot),
      lowStock,
    };
  });

  const totals = {
    employees: rows.reduce((s, r) => s + r.employees, 0),
    shifts: rows.reduce((s, r) => s + r.shifts, 0),
    laborAgorot: rows.reduce((s, r) => s + r.laborAgorot, 0),
    inventoryValueAgorot: rows.reduce((s, r) => s + r.inventoryValueAgorot, 0),
    lowStock: rows.reduce((s, r) => s + r.lowStock, 0),
  };

  return NextResponse.json({ rows, totals, weekStart: weekStart.toISOString() });
}
