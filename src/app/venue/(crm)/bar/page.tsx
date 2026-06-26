import { requireCapability } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { BarPOS } from "./bar-pos";

export default async function BarPosPage() {
  const ctx = await requireCapability("bar");
  // Bartender POS shows the BAR menu on top and the full RESTAURANT menu below,
  // so staff can sell food through the same dynamic-QR pay flow.
  const menu = await db.foodMenuItem.findMany({
    where: { venueId: ctx.venue.id, active: true },
    orderBy: [{ section: "asc" }, { category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, priceAgorot: true, section: true },
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
