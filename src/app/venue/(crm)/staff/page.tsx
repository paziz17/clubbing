import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { StaffClient } from "./staff-client";

function weekRange(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay(); // 0 = Sunday (start of week in IL)
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export default async function StaffPage() {
  const venue = await requireVenue();
  const { start, end } = weekRange();

  const [employees, shifts, events] = await Promise.all([
    db.employee.findMany({
      where: { venueId: venue.id },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    db.shift.findMany({
      where: { venueId: venue.id, startsAt: { gte: start, lt: end } },
      include: { employee: true },
      orderBy: { startsAt: "asc" },
    }),
    db.event.findMany({
      where: { venueId: venue.id, startsAt: { gte: new Date() } },
      select: { id: true, name: true, startsAt: true },
      orderBy: { startsAt: "asc" },
      take: 30,
    }),
  ]);

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">משמרות עובדים</h1>
        <p className="text-sm text-ink-muted">
          סידור עבודה שבועי, נוכחות, ועלות שכר אוטומטית · {venue.name}
        </p>
      </div>
      <StaffClient
        venueName={venue.name}
        initialEmployees={JSON.parse(JSON.stringify(employees))}
        initialShifts={JSON.parse(JSON.stringify(shifts))}
        events={JSON.parse(JSON.stringify(events))}
        weekStart={start.toISOString()}
      />
    </div>
  );
}
