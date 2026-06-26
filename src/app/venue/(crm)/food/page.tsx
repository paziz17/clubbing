import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { BarPOS } from "../bar/bar-pos";

export default async function FoodPage() {
  const venue = await requireVenue();
  // Kitchen behaves exactly like the bar: a fast-sale scanning POS that lists
  // the full menu (בר on top, מסעדה below) and pays via dynamic QR. No order
  // list / menu-management here by request.
  const menu = await db.foodMenuItem.findMany({
    where: { venueId: venue.id, active: true },
    orderBy: [{ section: "asc" }, { category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, priceAgorot: true, section: true },
  });

  return (
    <div className="crm-page-body">
      <BarPOS menu={menu} />
    </div>
  );
}
