import { randomBytes } from "crypto";
import { db } from "./db";
import {
  isGrowConfigured,
  createGrowPayment,
  approveGrowTransaction,
  refundGrowTransaction,
} from "./grow";
import { accrueCreditsForPurchase } from "./credits";
import { sendEmail } from "./email";
import { sendWhatsApp } from "./whatsapp";
import type { PaymentMethod } from "@/lib/enums";

/** paymentRef prefix that marks a reservation as paid through Grow. */
const GROW_REF_PREFIX = "grow:";

/** How long an approved order's payment link stays valid. */
const PAYMENT_LINK_TTL_MS = 24 * 60 * 60 * 1000;

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** Lock ticket stock for a reservation (throws when sold out). */
async function lockStock(tx: Tx, ticketTypeId: string | null | undefined, qty: number) {
  if (!ticketTypeId || qty <= 0) return;
  const ticket = await tx.ticketType.findUnique({ where: { id: ticketTypeId } });
  if (!ticket) return;
  if (ticket.stock != null && ticket.sold + qty > ticket.stock) {
    throw new Error("הכרטיסים אזלו");
  }
  await tx.ticketType.update({
    where: { id: ticketTypeId },
    data: { sold: { increment: qty } },
  });
}

/** Release previously-locked ticket stock (never goes below 0). */
async function releaseStock(tx: Tx, ticketTypeId: string | null | undefined, qty: number) {
  if (!ticketTypeId || qty <= 0) return;
  const ticket = await tx.ticketType.findUnique({ where: { id: ticketTypeId } });
  if (!ticket) return;
  await tx.ticketType.update({
    where: { id: ticketTypeId },
    data: { sold: Math.max(0, ticket.sold - qty) },
  });
}

const newPaymentToken = () => randomBytes(24).toString("base64url");

/**
 * Issue one TicketInstance (unique QR) per seat for a PAID reservation.
 * Idempotent — never double-issues if instances already exist.
 */
export async function issueTicketInstances(reservationId: string) {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true, eventId: true, venueId: true, quantity: true },
  });
  if (!reservation) return [];
  const existing = await db.ticketInstance.count({ where: { reservationId } });
  if (existing > 0) {
    return db.ticketInstance.findMany({ where: { reservationId }, orderBy: { seat: "asc" } });
  }
  const qty = Math.max(1, reservation.quantity);
  await db.ticketInstance.createMany({
    data: Array.from({ length: qty }, (_, i) => ({
      reservationId,
      eventId: reservation.eventId,
      venueId: reservation.venueId,
      seat: i + 1,
    })),
  });
  return db.ticketInstance.findMany({ where: { reservationId }, orderBy: { seat: "asc" } });
}

/** Lock in the promoter commission for a paid reservation (idempotent). */
async function applyPromoterCommission(reservationId: string) {
  const r = await db.reservation.findUnique({
    where: { id: reservationId },
    select: { promoterId: true, amountAgorot: true, promoterCommissionAgorot: true },
  });
  if (!r?.promoterId || r.promoterCommissionAgorot > 0) return;
  const promoter = await db.promoter.findUnique({
    where: { id: r.promoterId },
    select: { commissionPct: true },
  });
  if (!promoter || promoter.commissionPct <= 0) return;
  const commission = Math.round((r.amountAgorot * promoter.commissionPct) / 100);
  if (commission > 0) {
    await db.reservation.update({
      where: { id: reservationId },
      data: { promoterCommissionAgorot: commission },
    });
  }
}

/** Everything that must happen once a reservation reaches PAID. Idempotent. */
async function onReservationPaid(reservationId: string) {
  await issueTicketInstances(reservationId);
  await applyPromoterCommission(reservationId);
}

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
  promoterCode?: string; // tracking-link attribution (יחצן)
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

  // Enforce ticket sale window + active flag.
  if (ticket) {
    if (!ticket.active) throw new Error("סוג הכרטיס אינו זמין למכירה");
    const now = Date.now();
    if (ticket.salesStartAt && now < ticket.salesStartAt.getTime()) {
      throw new Error("מכירת הכרטיסים עוד לא נפתחה");
    }
    if (ticket.salesEndAt && now > ticket.salesEndAt.getTime()) {
      throw new Error("מכירת הכרטיסים הסתיימה");
    }
  }

  const unitPrice = ticket?.priceAgorot ?? event.basePriceAgorot;
  const subtotal = unitPrice * params.quantity;
  const serviceFee = Math.round(subtotal * 0.05);
  const vat = Math.round((subtotal + serviceFee) * 0.17);
  const total = subtotal + serviceFee + vat;

  // Resolve promoter attribution from the tracking-link code (must belong to
  // this event's venue and be active).
  let promoterId: string | undefined;
  if (params.promoterCode) {
    const promoter = await db.promoter.findFirst({
      where: { code: params.promoterCode, venueId: event.venueId, active: true },
      select: { id: true },
    });
    if (promoter) promoterId = promoter.id;
  }

  // Manual approval (selection): hold the order in Pending_Approval and lock
  // the stock until the organizer approves or rejects it.
  const manual = event.approvalPolicy === "MANUAL";

  // Lock stock + create the reservation atomically so two buyers can't grab
  // the same last ticket.
  const reservation = await db.$transaction(async (tx) => {
    await lockStock(tx, ticket?.id, params.quantity);
    return tx.reservation.create({
      data: {
        userId: params.userId ?? undefined,
        guestName: params.guest?.name,
        guestEmail: params.guest?.email,
        guestPhone: params.guest?.phone,
        venueId: event.venueId,
        eventId: event.id,
        ticketTypeId: ticket?.id,
        promoterId,
        quantity: params.quantity,
        amountAgorot: subtotal,
        feeAgorot: serviceFee,
        vatAgorot: vat,
        totalAgorot: total,
        status: manual ? "PENDING_APPROVAL" : "PENDING",
        paymentMethod: params.paymentMethod,
        skippedAuth: params.skippedAuth ?? false,
      },
    });
  });

  // Manual flow stops here — the organizer must approve before payment.
  if (manual) {
    return {
      reservationId: reservation.id,
      status: "pending_approval" as const,
      requiresApproval: true as const,
    };
  }

  if (params.paymentMethod === "CLUB_IT" && params.userId) {
    return finalizeClubItPayment(reservation.id);
  }

  const successUrl = `${params.origin}/tickets/${reservation.id}`;
  const cancelUrl = `${params.origin}/events/${event.id}`;

  // Grow (Meshulam) is the only card gateway: when configured it handles every
  // card / Bit / Apple Pay / Google Pay / PayBox charge. With no GROW_* env vars
  // we fall back to demo mode (auto-confirm) so the flow stays usable.
  if (isGrowConfigured()) {
    const grow = await createGrowPayment({
      amountAgorot: total,
      description: `כרטיס ל${event.name}`,
      successUrl,
      cancelUrl,
      notifyUrl: `${params.origin}/api/grow/webhook`,
      reservationId: reservation.id,
      fullName: params.guest?.name,
      phone: params.guest?.phone,
      email: params.guest?.email,
    });
    await db.reservation.update({
      where: { id: reservation.id },
      data: {
        paymentMethod: "GROW",
        paymentRef: `${GROW_REF_PREFIX}${grow.processId}:${grow.processToken}`,
      },
    });
    return { reservationId: reservation.id, checkoutUrl: grow.url };
  }

  // Demo mode (no gateway configured): auto-confirm end-to-end.
  return finalizeDemoPayment(reservation.id);
}

/** Mark a reservation PAID in demo mode (no real gateway). Idempotent. */
export async function finalizeDemoPayment(reservationId: string) {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) throw new Error("Reservation not found");

  if (reservation.status === "PAID") {
    return { reservationId, status: "paid" as const, alreadyPaid: true };
  }

  const ref = `demo_${Date.now()}`;
  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "PAID", paymentMethod: "DEMO", paymentRef: ref },
    });

    await tx.transaction.create({
      data: {
        reservationId,
        userId: reservation.userId,
        venueId: reservation.venueId,
        amountAgorot: reservation.totalAgorot,
        paymentMethod: "DEMO",
        paymentProvider: "demo",
        externalRef: ref,
        status: "PAID",
      },
    });
  });

  await onReservationPaid(reservationId);
  return { reservationId, status: "paid" as const };
}

/** Mark a Grow reservation PAID + record the transaction (idempotent). */
export async function finalizeGrowPayment(reservationId: string, externalRef: string) {
  const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) throw new Error("Reservation not found");
  if (reservation.status === "PAID") {
    return { reservationId, status: "paid" as const, alreadyPaid: true };
  }

  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "PAID" },
    });
    await tx.transaction.create({
      data: {
        reservationId,
        userId: reservation.userId,
        venueId: reservation.venueId,
        amountAgorot: reservation.totalAgorot,
        paymentMethod: "GROW",
        paymentProvider: "grow",
        externalRef,
        status: "PAID",
      },
    });
  });

  await onReservationPaid(reservationId);
  return { reservationId, status: "paid" as const };
}

/**
 * Reconcile a Grow reservation by calling the mandatory approveTransaction step.
 *
 * Used both by the server-to-server webhook and as a fallback on the success
 * page. Safe + idempotent: only finalizes when Grow approves the charge, skips
 * when the reservation is already PAID or wasn't paid via Grow.
 */
export async function reconcileGrowProcess(
  reservationId: string
): Promise<{ status: "paid" | "pending" | "skipped" }> {
  if (!isGrowConfigured()) return { status: "skipped" };

  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true, status: true, paymentRef: true, totalAgorot: true },
  });
  if (!reservation) return { status: "skipped" };
  if (reservation.status === "PAID") return { status: "paid" };
  if (!reservation.paymentRef?.startsWith(GROW_REF_PREFIX)) return { status: "skipped" };

  const [, processId, processToken] = reservation.paymentRef.split(":");
  if (!processId || !processToken) return { status: "skipped" };

  try {
    const approval = await approveGrowTransaction(processId, processToken);
    if (!approval.ok) return { status: "pending" };

    // Guard against tampered amounts: if Grow reports a sum, it must match.
    if (
      approval.amountAgorot != null &&
      Math.abs(approval.amountAgorot - reservation.totalAgorot) > 1
    ) {
      console.error(
        `Grow amount mismatch for ${reservationId}: charged ${approval.amountAgorot}, expected ${reservation.totalAgorot}`
      );
      return { status: "pending" };
    }

    await finalizeGrowPayment(reservationId, approval.transactionId ?? approval.asmachta ?? processId);
    return { status: "paid" };
  } catch (err) {
    console.error("Grow reconcile failed:", err);
    return { status: "pending" };
  }
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

  await onReservationPaid(reservationId);
  return {
    reservationId,
    status: "paid" as const,
    creditsEarned: accrual.creditsEarned,
    tier: accrual.tier,
    tierChanged: accrual.tierChanged,
  };
}

// ============================================================
//  MANUAL APPROVAL (SELECTION) LIFE-CYCLE
// ============================================================

/** Best-effort notify the bliner that their order was approved + payment link. */
async function notifyApproved(
  r: { guestName: string | null; guestEmail: string | null; guestPhone: string | null; user: { name: string | null; email: string | null; phone: string | null } | null; event: { name: string } },
  paymentUrl: string
) {
  const name = r.user?.name ?? r.guestName ?? "";
  const email = r.user?.email ?? r.guestEmail ?? null;
  const phone = r.user?.phone ?? r.guestPhone ?? null;
  const msg = `אושרת לאירוע ${r.event.name}! 🎉 להשלמת הרכישה: ${paymentUrl}`;

  if (email) {
    const html = `<!doctype html><html dir="rtl" lang="he"><body style="font-family:-apple-system,sans-serif;background:#06060A;color:#F5F1E6;padding:24px;">
        <div style="max-width:480px;margin:0 auto;background:#10101A;border:1px solid #23232F;border-radius:16px;overflow:hidden;">
          <div style="padding:24px;text-align:center;border-bottom:1px solid #23232F;"><h1 style="margin:0;color:#D4AF37;letter-spacing:4px;font-size:22px;">CLUBBING</h1></div>
          <div style="padding:28px;">
            <p style="font-size:14px;color:#9A9387;margin:0 0 8px;">היי ${name},</p>
            <h2 style="margin:0 0 16px;color:#D4AF37;">אושרת ל${r.event.name} ✓</h2>
            <p style="font-size:14px;color:#9A9387;">להשלמת הרכישה וקבלת הכרטיס, לחצ/י על הכפתור (הקישור בתוקף ל-24 שעות):</p>
            <div style="text-align:center;margin:24px 0;"><a href="${paymentUrl}" style="display:inline-block;background:#D4AF37;color:#06060A;font-weight:700;padding:14px 28px;border-radius:999px;text-decoration:none;">להשלמת התשלום</a></div>
          </div>
        </div></body></html>`;
    await sendEmail({ to: email, subject: `אושרת ל${r.event.name} — להשלמת התשלום`, html }).catch(() => {});
  }
  if (phone) {
    await sendWhatsApp({ to: phone.replace(/\D/g, ""), message: msg }).catch(() => {});
  }
}

/** Organizer approves a Pending_Approval order → Pending_Payment + payment link. */
export async function approveReservation(
  reservationId: string,
  approverId: string,
  origin: string
): Promise<{ reservationId: string; status: "pending_payment"; paymentUrl: string }> {
  const r = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { event: true, user: true },
  });
  if (!r) throw new Error("Reservation not found");
  if (r.status !== "PENDING_APPROVAL") {
    throw new Error("רק הזמנות הממתינות לאישור ניתנות לאישור");
  }

  const token = newPaymentToken();
  await db.reservation.update({
    where: { id: reservationId },
    data: {
      status: "PENDING_PAYMENT",
      approvedAt: new Date(),
      approvedBy: approverId,
      paymentToken: token,
      paymentExpiresAt: new Date(Date.now() + PAYMENT_LINK_TTL_MS),
    },
  });

  const paymentUrl = `${origin}/pay/${reservationId}?t=${token}`;
  await notifyApproved(r, paymentUrl).catch(() => {});
  return { reservationId, status: "pending_payment", paymentUrl };
}

/** Organizer rejects a Pending_Approval order → Rejected + release stock. */
export async function rejectReservation(
  reservationId: string,
  byUserId: string,
  reason?: string
): Promise<{ reservationId: string; status: "rejected" }> {
  const r = await db.reservation.findUnique({ where: { id: reservationId } });
  if (!r) throw new Error("Reservation not found");
  if (r.status !== "PENDING_APPROVAL") {
    throw new Error("רק הזמנות הממתינות לאישור ניתנות לדחייה");
  }

  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        approvedBy: byUserId,
        rejectionReason: reason ?? null,
      },
    });
    await releaseStock(tx, r.ticketTypeId, r.quantity);
  });

  return { reservationId, status: "rejected" };
}

/**
 * Complete payment for an approved order via its payment link.
 * Validates the token + Pending_Payment status + expiry, then routes to Grow
 * (or demo auto-confirm when no gateway is configured).
 */
export async function payApprovedReservation(
  reservationId: string,
  token: string,
  origin: string
): Promise<
  | { reservationId: string; status: "paid"; alreadyPaid?: boolean }
  | { reservationId: string; status: "checkout"; checkoutUrl: string }
> {
  const r = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { event: true, user: true },
  });
  if (!r) throw new Error("Reservation not found");
  if (!r.paymentToken || r.paymentToken !== token) throw new Error("לינק תשלום לא תקין");
  if (r.status === "PAID") return { reservationId, status: "paid", alreadyPaid: true };
  if (r.status !== "PENDING_PAYMENT") throw new Error("ההזמנה אינה ממתינה לתשלום");
  if (r.paymentExpiresAt && r.paymentExpiresAt.getTime() < Date.now()) {
    await expireReservation(reservationId);
    throw new Error("פג תוקף לינק התשלום");
  }

  const successUrl = `${origin}/tickets/${reservationId}`;
  const cancelUrl = `${origin}/pay/${reservationId}?t=${token}`;

  if (isGrowConfigured()) {
    const grow = await createGrowPayment({
      amountAgorot: r.totalAgorot,
      description: `כרטיס ל${r.event.name}`,
      successUrl,
      cancelUrl,
      notifyUrl: `${origin}/api/grow/webhook`,
      reservationId,
      fullName: r.user?.name ?? r.guestName ?? undefined,
      phone: r.user?.phone ?? r.guestPhone ?? undefined,
      email: r.user?.email ?? r.guestEmail ?? undefined,
    });
    await db.reservation.update({
      where: { id: reservationId },
      data: {
        paymentMethod: "GROW",
        paymentRef: `${GROW_REF_PREFIX}${grow.processId}:${grow.processToken}`,
      },
    });
    return { reservationId, status: "checkout", checkoutUrl: grow.url };
  }

  const res = await finalizeDemoPayment(reservationId);
  return { reservationId, status: "paid", alreadyPaid: res.alreadyPaid };
}

/** Expire a stale unpaid order (Pending_Payment / legacy Pending) + release stock. */
export async function expireReservation(reservationId: string) {
  const r = await db.reservation.findUnique({ where: { id: reservationId } });
  if (!r) return;
  if (!["PENDING_PAYMENT", "PENDING", "PENDING_APPROVAL"].includes(r.status)) return;
  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "EXPIRED" },
    });
    await releaseStock(tx, r.ticketTypeId, r.quantity);
  });
}

/**
 * Full refund for a paid reservation, scoped to the owning venue.
 *
 * - Issues a real Grow refund when the payment was a Grow charge.
 *   Demo / Club-it payments have nothing external, so only the internal
 *   records are reversed.
 * - Marks the reservation + transaction as REFUNDED.
 * - Reverses any loyalty credits that were earned on the purchase.
 *
 * Idempotent: refunding an already-refunded reservation is a no-op.
 */
export async function refundReservation(
  reservationId: string,
  venueId: string
): Promise<{ status: "refunded"; gatewayRefunded: boolean }> {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { transaction: true, user: { include: { clubItCard: true } } },
  });
  if (!reservation) throw new Error("Reservation not found");
  if (reservation.venueId !== venueId) throw new Error("Forbidden");
  if (reservation.status === "REFUNDED") {
    return { status: "refunded", gatewayRefunded: false };
  }
  if (reservation.status !== "PAID") {
    throw new Error("Only paid reservations can be refunded");
  }

  // 1) Real gateway refund via Grow when it was a Grow charge.
  //    Demo / Club-it have nothing external to refund.
  let gatewayRefunded = false;
  const ref = reservation.paymentRef ?? reservation.transaction?.externalRef ?? "";
  const isGrow =
    reservation.transaction?.paymentProvider === "grow" || ref.startsWith(GROW_REF_PREFIX);
  if (isGrow && isGrowConfigured()) {
    const txnId = reservation.transaction?.externalRef ?? "";
    if (txnId) {
      const r = await refundGrowTransaction(txnId, reservation.totalAgorot);
      gatewayRefunded = r.ok;
    }
  }

  // 2) Reverse internal records (and any loyalty credits earned).
  const card = reservation.user?.clubItCard;
  const creditsToReverse = reservation.creditsEarned;

  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "REFUNDED" },
    });
    await tx.ticketInstance.updateMany({
      where: { reservationId, status: { not: "CHECKED_IN" } },
      data: { status: "VOID" },
    });
    await releaseStock(tx, reservation.ticketTypeId, reservation.quantity);
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

  return { status: "refunded", gatewayRefunded };
}
