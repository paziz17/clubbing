import { db } from "./db";
import { createCheckoutSession, stripe } from "./stripe";
import { accrueCreditsForPurchase } from "./credits";
import type { PaymentMethod } from "@/lib/enums";

interface InitiateParams {
  eventId: string;
  ticketTypeId?: string;
  quantity: number;
  userId?: string | null;
  guest?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  paymentMethod: PaymentMethod;
  skippedAuth?: boolean;
  origin: string; // for success/cancel URLs
}

export async function initiate(params: InitiateParams) {
  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: { tickets: true, venue: { include: { settings: true } } },
  });
  if (!event) throw new Error("Event not found");

  const ticket = params.ticketTypeId
    ? event.tickets.find((t) => t.id === params.ticketTypeId)
    : event.tickets[0];
  const unitPrice = ticket?.priceAgorot ?? event.basePriceAgorot;
  const subtotal = unitPrice * params.quantity;
  const serviceFee = Math.round(subtotal * 0.05);
  const vat = Math.round((subtotal + serviceFee) * 0.17);
  const total = subtotal + serviceFee + vat;

  const reservation = await db.reservation.create({
    data: {
      userId: params.userId ?? undefined,
      guestName: params.guest?.name,
      guestEmail: params.guest?.email,
      guestPhone: params.guest?.phone,
      venueId: event.venueId,
      eventId: event.id,
      ticketTypeId: ticket?.id,
      quantity: params.quantity,
      amountAgorot: subtotal,
      feeAgorot: serviceFee,
      vatAgorot: vat,
      totalAgorot: total,
      status: "PENDING",
      paymentMethod: params.paymentMethod,
      skippedAuth: params.skippedAuth ?? false,
    },
  });

  if (params.paymentMethod === "CLUB_IT" && params.userId) {
    return finalizeClubItPayment(reservation.id);
  }

  const successUrl = `${params.origin}/tickets/${reservation.id}`;
  const cancelUrl = `${params.origin}/events/${event.id}`;

  const session = await createCheckoutSession({
    amountAgorot: total,
    successUrl,
    cancelUrl,
    customerEmail: params.guest?.email,
    metadata: { reservationId: reservation.id },
  });

  if (session.demo) {
    // Demo mode: auto-confirm so the flow stays usable end-to-end
    return finalizeStripePayment(reservation.id, session.sessionId, { demo: true });
  }

  await db.reservation.update({
    where: { id: reservation.id },
    data: { paymentRef: session.sessionId },
  });

  return { reservationId: reservation.id, checkoutUrl: session.url };
}

export async function finalizeStripePayment(
  reservationId: string,
  paymentRef: string,
  opts: { demo?: boolean } = {}
) {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) throw new Error("Reservation not found");

  // Idempotent: if it's already paid we don't create a duplicate transaction.
  // (The webhook and the success-page reconciliation can both fire.)
  if (reservation.status === "PAID") {
    return { reservationId, status: "paid" as const, alreadyPaid: true };
  }

  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "PAID",
        paymentRef,
      },
    });

    await tx.transaction.create({
      data: {
        reservationId,
        userId: reservation.userId,
        venueId: reservation.venueId,
        amountAgorot: reservation.totalAgorot,
        paymentMethod: (reservation.paymentMethod as PaymentMethod) ?? "STRIPE_CARD",
        paymentProvider: opts.demo ? "demo" : "stripe",
        externalRef: paymentRef,
        status: "PAID",
      },
    });
  });

  return { reservationId, status: "paid" as const };
}

export async function finalizeClubItPayment(reservationId: string) {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { user: { include: { clubItCard: true } } },
  });
  if (!reservation || !reservation.user?.clubItCard)
    throw new Error("Club-it card required");

  const card = reservation.user.clubItCard;
  const accrual = await accrueCreditsForPurchase({
    cardId: card.id,
    venueId: reservation.venueId,
    amountAgorot: reservation.totalAgorot,
    reservationId: reservation.id,
    note: "Ticket purchase",
  });

  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "PAID",
        paymentMethod: "CLUB_IT",
        creditsEarned: accrual.creditsEarned,
      },
    });
    await tx.transaction.create({
      data: {
        reservationId,
        userId: reservation.userId,
        venueId: reservation.venueId,
        amountAgorot: reservation.totalAgorot,
        creditsDelta: accrual.creditsEarned,
        paymentMethod: "CLUB_IT",
        paymentProvider: "club-it",
        status: "PAID",
      },
    });
  });

  return {
    reservationId,
    status: "paid" as const,
    creditsEarned: accrual.creditsEarned,
    tier: accrual.tier,
    tierChanged: accrual.tierChanged,
  };
}

/**
 * Reconcile a reservation against its Stripe Checkout Session.
 *
 * Called from the success page (and usable as a fallback when no webhook is
 * configured — ideal for a free Stripe Test-Mode POC). Safe + idempotent:
 * only finalizes when Stripe reports the session as paid, and skips if the
 * reservation is already PAID.
 */
export async function reconcileStripeSession(
  reservationId: string,
  sessionId: string
): Promise<{ status: "paid" | "pending" | "skipped" }> {
  if (!stripe || !sessionId) return { status: "skipped" };

  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true, status: true },
  });
  if (!reservation) return { status: "skipped" };
  if (reservation.status === "PAID") return { status: "paid" };

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const ref =
        (typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id) ?? session.id;
      await finalizeStripePayment(reservationId, ref);
      return { status: "paid" };
    }
  } catch (err) {
    console.error("Stripe reconcile failed:", err);
  }
  return { status: "pending" };
}

/**
 * Full refund for a paid reservation, scoped to the owning venue.
 *
 * - Issues a real Stripe refund when the payment was a card charge (pi_...).
 *   In demo / Club-it payments there is nothing to refund at Stripe, so only
 *   the internal records are reversed.
 * - Marks the reservation + transaction as REFUNDED.
 * - Reverses any loyalty credits that were earned on the purchase.
 *
 * Idempotent: refunding an already-refunded reservation is a no-op.
 */
export async function refundReservation(
  reservationId: string,
  venueId: string
): Promise<{ status: "refunded"; stripeRefunded: boolean }> {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { transaction: true, user: { include: { clubItCard: true } } },
  });
  if (!reservation) throw new Error("Reservation not found");
  if (reservation.venueId !== venueId) throw new Error("Forbidden");
  if (reservation.status === "REFUNDED") {
    return { status: "refunded", stripeRefunded: false };
  }
  if (reservation.status !== "PAID") {
    throw new Error("Only paid reservations can be refunded");
  }

  // 1) Real Stripe refund when this was a card charge.
  let stripeRefunded = false;
  const ref = reservation.paymentRef ?? reservation.transaction?.externalRef ?? "";
  if (stripe && ref.startsWith("pi_")) {
    await stripe.refunds.create({ payment_intent: ref });
    stripeRefunded = true;
  }

  // 2) Reverse internal records (and any loyalty credits earned).
  const card = reservation.user?.clubItCard;
  const creditsToReverse = reservation.creditsEarned;

  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "REFUNDED" },
    });
    if (reservation.transaction) {
      await tx.transaction.update({
        where: { id: reservation.transaction.id },
        data: { status: "REFUNDED" },
      });
    }
    if (card && creditsToReverse > 0) {
      const bal = await tx.userBalance.findUnique({
        where: { cardId_venueId: { cardId: card.id, venueId } },
      });
      const deduct = Math.min(creditsToReverse, bal?.creditsBalance ?? 0);
      await tx.creditLedger.create({
        data: {
          cardId: card.id,
          venueId,
          kind: "ADJUST",
          amount: -creditsToReverse,
          ref: reservationId,
          note: "Refund reversal",
        },
      });
      if (bal) {
        await tx.userBalance.update({
          where: { cardId_venueId: { cardId: card.id, venueId } },
          data: {
            creditsBalance: { decrement: deduct },
            creditsAccrued: { decrement: creditsToReverse },
          },
        });
      }
      await tx.clubItCard.update({
        where: { id: card.id },
        data: { totalSpentAgorot: { decrement: reservation.totalAgorot } },
      });
    }
  });

  return { status: "refunded", stripeRefunded };
}
