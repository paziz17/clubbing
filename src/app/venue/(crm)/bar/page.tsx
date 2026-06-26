import { requireVenueSession } from "@/lib/venue-session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { BarPOS } from "./bar-pos";

export default async function BarPosPage() {
  // Unified bar + kitchen POS — accessible to bar OR kitchen staff.
  const ctx = await requireVenueSession();
  if (!can(ctx.role, "bar") && !can(ctx.role, "food")) throw new Error("FORBIDDEN");
  // One screen with the full menu: בר on top, מסעדה below — sold via dynamic-QR.
  const menu = await db.foodMenuItem.findMany({
    where: { venueId: ctx.venue.id, active: true },
    orderBy: [{ section: "asc" }, { category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, priceAgorot: true, section: true },
  });

  return (
    <div className="crm-page-body">
      <BarPOS menu={menu} />
    </div>
  );
}
