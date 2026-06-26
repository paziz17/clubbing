import { requireCapability } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { BarPOS } from "./bar-pos";

export default async function BarPosPage() {
  const ctx = await requireCapability("bar");
  const menu = await db.foodMenuItem.findMany({
    where: { venueId: ctx.venue.id, active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, priceAgorot: true },
  });

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">בר · מכירה מהירה</h1>
        <p className="text-sm text-ink-muted">
          בחר/י פריטים → צור הזמנה → הבליין סורק ומשלם מהטלפון
        </p>
      </div>
      <BarPOS menu={menu} />
    </div>
  );
}
