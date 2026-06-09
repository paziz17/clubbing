import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redeemCredits } from "@/lib/credits";
import { deductForFoodOrder } from "@/lib/inventory";
import { generatePickupCode } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/enums";

interface OrderInput {
  venueId: string;
  items: { itemId: string; qty: number }[];
  creditsApplied?: number;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const body = (await req.json()) as OrderInput;

  const items = await db.foodMenuItem.findMany({
    where: { id: { in: body.items.map((i) => i.itemId) }, venueId: body.venueId, active: true },
  });
  if (items.length !== body.items.length) {
    return NextResponse.json({ error: "Some items unavailable" }, { status: 400 });
  }

  const itemsSnapshot = body.items.map((i) => {
    const m = items.find((x) => x.id === i.itemId)!;
    return { itemId: m.id, name: m.name, qty: i.qty, priceAgorot: m.priceAgorot };
  });
  const subtotal = itemsSnapshot.reduce((s, i) => s + i.priceAgorot * i.qty, 0);
  const creditsApplied = Math.min(body.creditsApplied ?? 0, subtotal);
  const cardCharge = subtotal - creditsApplied;

  let paymentMethod: PaymentMethod = "STRIPE_CARD";
  if (creditsApplied === subtotal) paymentMethod = "CREDITS";
  else if (creditsApplied > 0) paymentMethod = "MIXED";

  // Validate credits if any
  if (creditsApplied > 0 && userId) {
    const card = await db.clubItCard.findUnique({ where: { userId } });
    if (!card) {
      return NextResponse.json({ error: "Club-it required for credits" }, { status: 400 });
    }
    await redeemCredits({
      cardId: card.id,
      venueId: body.venueId,
      amount: creditsApplied,
      kind: "REDEEM_FOOD",
      note: "Food order",
    });
  }

  const order = await db.foodOrder.create({
    data: {
      pickupCode: generatePickupCode(),
      userId,
      venueId: body.venueId,
      items: JSON.stringify(itemsSnapshot),
      subtotalAgorot: subtotal,
      creditsApplied,
      cardChargedAgorot: cardCharge,
      paymentMethod,
      orderItems: {
        create: itemsSnapshot.map((i) => ({
          itemId: i.itemId,
          qty: i.qty,
          unitPriceAgorot: i.priceAgorot,
        })),
      },
    },
  });

  // Smart warehouse: auto-deduct linked ingredients from inventory.
  // Never blocks the order — failures are swallowed inside the helper.
  await deductForFoodOrder({
    venueId: body.venueId,
    orderId: order.id,
    items: body.items.map((i) => ({ itemId: i.itemId, qty: i.qty })),
  });

  return NextResponse.json({
    orderId: order.id,
    pickupCode: order.pickupCode,
    subtotal,
    creditsApplied,
    cardCharge,
  });
}
