import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { FoodTabs } from "./tabs";

export default async function FoodPage() {
  const venue = await requireVenue();
  const [menu, orders] = await Promise.all([
    db.foodMenuItem.findMany({
      where: { venueId: venue.id },
      orderBy: { category: "asc" },
    }),
    db.foodOrder.findMany({
      where: { venueId: venue.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">מטבח</h1>
        <p className="text-sm text-ink-muted">תפריט והזמנות מראש מבליינים</p>
      </div>
      <FoodTabs
        menu={JSON.parse(JSON.stringify(menu))}
        orders={JSON.parse(JSON.stringify(orders))}
        venueId={venue.id}
      />
    </div>
  );
}
