import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const venue = await requireVenue();

  const [items, suppliers, movements, menu, recipes] = await Promise.all([
    db.inventoryItem.findMany({
      where: { venueId: venue.id },
      include: { supplier: true },
      orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
    }),
    db.supplier.findMany({ where: { venueId: venue.id }, orderBy: { name: "asc" } }),
    db.stockMovement.findMany({
      where: { venueId: venue.id },
      include: { item: { select: { name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.foodMenuItem.findMany({
      where: { venueId: venue.id, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.menuItemIngredient.findMany({
      where: { menuItem: { venueId: venue.id } },
      include: { inventoryItem: { select: { name: true, unit: true } } },
    }),
  ]);

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">מחסן חכם</h1>
        <p className="text-sm text-ink-muted">
          ניהול מלאי, ניכוי אוטומטי לפי מכירות, התראות והזמנות חוזרות · {venue.name}
        </p>
      </div>
      <InventoryClient
        initialItems={JSON.parse(JSON.stringify(items))}
        initialSuppliers={JSON.parse(JSON.stringify(suppliers))}
        movements={JSON.parse(JSON.stringify(movements))}
        menu={JSON.parse(JSON.stringify(menu))}
        recipes={JSON.parse(JSON.stringify(recipes))}
      />
    </div>
  );
}
