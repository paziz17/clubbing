/**
 * Shared inventory helpers — stock movements + automatic deduction.
 * A movement is the single source of truth: stockQty on the item is kept
 * consistent by always going through these helpers.
 */

import { db } from "./db";

export type MovementType = "IN" | "OUT" | "ADJUST" | "WASTE" | "SALE_AUTO";

/**
 * Apply a stock movement and keep InventoryItem.stockQty in sync atomically.
 * `qty` is the signed delta (positive adds stock, negative removes).
 */
export async function applyStockMovement(opts: {
  venueId: string;
  itemId: string;
  type: MovementType;
  qty: number;
  reason?: string | null;
  ref?: string | null;
}) {
  const { venueId, itemId, type, qty, reason, ref } = opts;
  return db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({ where: { id: itemId, venueId } });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    const updated = await tx.inventoryItem.update({
      where: { id: itemId },
      data: { stockQty: { increment: qty } },
    });
    const movement = await tx.stockMovement.create({
      data: { venueId, itemId, type, qty, reason: reason ?? null, ref: ref ?? null },
    });
    return { item: updated, movement };
  });
}

/**
 * Auto-deduct ingredients for a confirmed food order.
 * Looks up MenuItemIngredient recipes for every sold menu item and decrements
 * the linked inventory. Never throws — inventory issues must not block ordering.
 */
export async function deductForFoodOrder(opts: {
  venueId: string;
  orderId: string;
  items: { itemId: string; qty: number }[];
}) {
  const { venueId, orderId, items } = opts;
  try {
    const menuItemIds = items.map((i) => i.itemId);
    const links = await db.menuItemIngredient.findMany({
      where: { menuItemId: { in: menuItemIds } },
    });
    if (links.length === 0) return { deducted: 0 };

    // aggregate consumption per inventory item
    const consume = new Map<string, number>();
    for (const sold of items) {
      const recipe = links.filter((l) => l.menuItemId === sold.itemId);
      for (const r of recipe) {
        const total = r.qtyPerUnit * sold.qty;
        consume.set(r.inventoryItemId, (consume.get(r.inventoryItemId) ?? 0) + total);
      }
    }

    let deducted = 0;
    for (const [invId, qty] of consume.entries()) {
      if (qty <= 0) continue;
      try {
        await applyStockMovement({
          venueId,
          itemId: invId,
          type: "SALE_AUTO",
          qty: -qty,
          reason: "ניכוי אוטומטי מהזמנת מטבח",
          ref: orderId,
        });
        deducted++;
      } catch {
        /* item may belong to a different venue / be deleted — skip */
      }
    }
    return { deducted };
  } catch {
    return { deducted: 0 };
  }
}

/** Items at or below their par level (reorder threshold). */
export function isLowStock(item: { stockQty: number; parLevel: number }) {
  return item.parLevel > 0 && item.stockQty <= item.parLevel;
}
