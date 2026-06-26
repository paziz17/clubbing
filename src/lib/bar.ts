import { db } from "./db";
import { isGrowConfigured, createGrowPayment, approveGrowTransaction } from "./grow";
import { redeemCredits } from "./credits";

const GROW_REF_PREFIX = "grow:";

export interface BarCartItem {
  id: string; // FoodMenuItem id
  qty: number;
}

/**
 * Bartender opens a tab: prices are resolved from the venue menu (never trust
 * client prices). Returns a Pending_Payment order whose id is encoded into the
 * dynamic QR the bliner scans.
 */
export async function createBarOrder(params: {
  venueId: string;
  bartenderId?: string | null;
  bartenderName?: string | null;
  items: BarCartItem[];
}) {
  const ids = params.items.filter((i) => i.qty > 0).map((i) => i.id);
  if (ids.length === 0) throw new Error("העגלה ריקה");

  const menu = await db.foodMenuItem.findMany({
    where: { id: { in: ids }, venueId: params.venueId, active: true },
  });
  const byId = new Map(menu.map((m) => [m.id, m]));

  const snapshot = params.items
    .filter((i) => i.qty > 0 && byId.has(i.id))
    .map((i) => {
      const m = byId.get(i.id)!;
      return { id: m.id, name: m.name, qty: i.qty, priceAgorot: m.priceAgorot };
    });
  if (snapshot.length === 0) throw new Error("לא נמצאו פריטים תקפים");

  const subtotal = snapshot.reduce((s, it) => s + it.priceAgorot * it.qty, 0);

  return db.barOrder.create({
    data: {
      venueId: params.venueId,
      bartenderId: params.bartenderId ?? null,
      bartenderName: params.bartenderName ?? null,
      items: JSON.stringify(snapshot),
      subtotalAgorot: subtotal,
      status: "PENDING_PAYMENT",
    },
  });
}

/** Record a bar order as PAID + write the venue ledger transaction. Idempotent. */
async function finalizeBarOrderPaid(
  orderId: string,
  opts: { method: string; provider?: string; externalRef?: string; creditsApplied?: number; userId?: string | null }
) {
  const order = await db.barOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.status === "PAID") return { status: "paid" as const, alreadyPaid: true };

  const creditsApplied = opts.creditsApplied ?? 0;
  const cardCharged = Math.max(0, order.subtotalAgorot - creditsApplied);

  await db.$transaction(async (tx) => {
    await tx.barOrder.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: opts.method,
        paymentRef: opts.externalRef ?? order.paymentRef,
        userId: opts.userId ?? order.userId,
        creditsApplied,
        cardChargedAgorot: cardCharged,
      },
    });
    await tx.transaction.create({
      data: {
        userId: opts.userId ?? order.userId ?? null,
        venueId: order.venueId,
        amountAgorot: order.subtotalAgorot,
        creditsDelta: -creditsApplied,
        paymentMethod: opts.method,
        paymentProvider: opts.provider ?? opts.method.toLowerCase(),
        externalRef: opts.externalRef ?? `bar_${orderId}`,
        status: "PAID",
      },
    });
  });

  return { status: "paid" as const };
}

/**
 * Bliner pays a bar order from their phone.
 *  - Wallet credits (full or partial) when logged in + has balance at the venue.
 *  - Remaining (or full) via Grow card page; demo auto-confirm when no gateway.
 */
export async function payBarOrder(params: {
  orderId: string;
  userId?: string | null;
  method: "CARD" | "WALLET";
  origin: string;
}): Promise<
  | { status: "paid"; alreadyPaid?: boolean }
  | { status: "checkout"; checkoutUrl: string }
> {
  const order = await db.barOrder.findUnique({ where: { id: params.orderId } });
  if (!order) throw new Error("Order not found");
  if (order.status === "PAID") return { status: "paid", alreadyPaid: true };
  if (order.status !== "PENDING_PAYMENT") throw new Error("ההזמנה אינה זמינה לתשלום");

  // Wallet credits (per-venue balance on the user's Club-it card).
  let creditsApplied = 0;
  if (params.method === "WALLET") {
    if (!params.userId) throw new Error("נדרשת התחברות לשימוש בארנק");
    const card = await db.clubItCard.findUnique({ where: { userId: params.userId } });
    if (!card) throw new Error("אין ארנק Club-it");
    const bal = await db.userBalance.findUnique({
      where: { cardId_venueId: { cardId: card.id, venueId: order.venueId } },
    });
    const available = bal?.creditsBalance ?? 0;
    creditsApplied = Math.min(available, order.subtotalAgorot);
    if (creditsApplied > 0) {
      await redeemCredits({
        cardId: card.id,
        venueId: order.venueId,
        amount: creditsApplied,
        kind: "REDEEM_BAR",
        ref: order.id,
        note: "Bar purchase",
      });
    }
    // Fully covered by wallet → done.
    if (creditsApplied >= order.subtotalAgorot) {
      return finalizeBarOrderPaid(order.id, {
        method: "CREDITS",
        provider: "wallet",
        creditsApplied,
        userId: params.userId,
      });
    }
  }

  const remaining = order.subtotalAgorot - creditsApplied;

  // Card charge for the remaining amount.
  if (isGrowConfigured()) {
    const grow = await createGrowPayment({
      amountAgorot: remaining,
      description: "רכישה בבר",
      successUrl: `${params.origin}/bar/paid/${order.id}`,
      cancelUrl: `${params.origin}/bar/pay/${order.id}`,
      notifyUrl: `${params.origin}/api/grow/webhook`,
      reservationId: `bar:${order.id}`,
    });
    await db.barOrder.update({
      where: { id: order.id },
      data: {
        creditsApplied,
        paymentMethod: "GROW",
        paymentRef: `${GROW_REF_PREFIX}${grow.processId}:${grow.processToken}`,
        userId: params.userId ?? order.userId,
      },
    });
    return { status: "checkout", checkoutUrl: grow.url };
  }

  // Demo mode (no gateway): auto-confirm.
  return finalizeBarOrderPaid(order.id, {
    method: creditsApplied > 0 ? "MIXED" : "DEMO",
    provider: "demo",
    creditsApplied,
    userId: params.userId,
  });
}

/** Reconcile a Grow-charged bar order (webhook + success-page fallback). */
export async function reconcileGrowBarOrder(
  orderId: string
): Promise<{ status: "paid" | "pending" | "skipped" }> {
  if (!isGrowConfigured()) return { status: "skipped" };
  const order = await db.barOrder.findUnique({ where: { id: orderId } });
  if (!order) return { status: "skipped" };
  if (order.status === "PAID") return { status: "paid" };
  if (!order.paymentRef?.startsWith(GROW_REF_PREFIX)) return { status: "skipped" };

  const [, processId, processToken] = order.paymentRef.split(":");
  if (!processId || !processToken) return { status: "skipped" };

  try {
    const approval = await approveGrowTransaction(processId, processToken);
    if (!approval.ok) return { status: "pending" };
    await finalizeBarOrderPaid(orderId, {
      method: "GROW",
      provider: "grow",
      externalRef: approval.transactionId ?? approval.asmachta ?? processId,
      creditsApplied: order.creditsApplied,
      userId: order.userId,
    });
    return { status: "paid" };
  } catch (err) {
    console.error("Grow bar reconcile failed:", err);
    return { status: "pending" };
  }
}
