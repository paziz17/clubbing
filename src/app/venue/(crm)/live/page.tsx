import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { LiveDashboard } from "./live-dashboard";

export default async function LivePage() {
  const venue = await requireVenue();
  const todayStart = new Date();
  todayStart.setHours(18, 0, 0, 0);

  const tonightEvent = await db.event.findFirst({
    where: {
      venueId: venue.id,
      startsAt: { gte: todayStart },
      status: "PUBLISHED",
    },
    orderBy: { startsAt: "asc" },
  });

  return (
    <LiveDashboard
      venueId={venue.id}
      venueName={venue.name}
      event={tonightEvent ? JSON.parse(JSON.stringify(tonightEvent)) : null}
    />
  );
}
