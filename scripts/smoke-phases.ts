/**
 * Phases 2–6 smoke test. Run: DATABASE_URL=... tsx scripts/smoke-phases.ts
 *
 * Phase 2  Ticket Instances : one VALID QR per seat on PAID, VOID on refund.
 * Phase 3  Promoters         : tracking attribution + commission on PAID.
 * Phase 4  Sale windows       : enforced (future / past / inactive → blocked).
 * Phase 5  Bar POS            : dynamic order → card (demo) + wallet credits pay.
 * Phase 6  Payouts            : Net balance (gross−commission) + settlement reset.
 */
import { db } from "@/lib/db";
import { initiate, refundReservation } from "@/lib/checkout";
import { createBarOrder, payBarOrder } from "@/lib/bar";
import { computeVenueBalance, settleVenue } from "@/lib/payouts";

const assert = (cond: any, msg: string) => {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ✓ " + msg);
};
const origin = "http://localhost:3000";

async function main() {
  const tag = "smoke-px-" + Date.now();
  const venue = await db.venue.create({
    data: { slug: tag, name: "Smoke PX", username: tag, passwordHash: "x", address: "T 1", city: "TLV" },
  });
  await db.venueSettings.create({ data: { venueId: venue.id, clubbingCommissionPct: 10 } });

  const event = await db.event.create({
    data: {
      venueId: venue.id, name: "PX Event", startsAt: new Date(Date.now() + 86400000),
      basePriceAgorot: 10000, capacity: 100, approvalPolicy: "AUTO", status: "PUBLISHED",
      tickets: { create: [{ kind: "STANDARD", label: "רגיל", priceAgorot: 10000, stock: 20 }] },
    },
    include: { tickets: true },
  });
  const ticket = event.tickets[0];

  let failed = false;
  try {
    // ---------- Phase 2: ticket instances ----------
    console.log("\n[P2] Ticket instances");
    const r1: any = await initiate({
      eventId: event.id, ticketTypeId: ticket.id, quantity: 3, paymentMethod: "GROW",
      guest: { name: "דנה", email: "dana@test.dev", phone: "0501112222" }, origin,
    });
    assert(r1.status === "paid", "AUTO demo → paid");
    const inst = await db.ticketInstance.findMany({ where: { reservationId: r1.reservationId } });
    assert(inst.length === 3, "3 ticket instances issued (one per seat)");
    assert(inst.every((i) => i.status === "VALID"), "all instances VALID");
    assert(new Set(inst.map((i) => i.code)).size === 3, "instance codes are unique");
    // Simulate a door check-in then a duplicate scan.
    await db.ticketInstance.update({ where: { id: inst[0].id }, data: { status: "CHECKED_IN", checkedInAt: new Date() } });
    const reScan = await db.ticketInstance.findUnique({ where: { id: inst[0].id } });
    assert(reScan?.status === "CHECKED_IN", "scanned seat becomes CHECKED_IN (dup scan would be 'already_used')");
    // Refund voids the rest.
    await refundReservation(r1.reservationId, venue.id);
    const afterRefund = await db.ticketInstance.findMany({ where: { reservationId: r1.reservationId } });
    assert(afterRefund.filter((i) => i.status === "VOID").length === 2, "non-checked-in instances VOID on refund");

    // ---------- Phase 3: promoter commission ----------
    console.log("\n[P3] Promoter attribution + commission");
    const promoter = await db.promoter.create({
      data: { venueId: venue.id, name: "יחצן בדיקה", code: tag + "-pr", commissionPct: 10, active: true },
    });
    const r2: any = await initiate({
      eventId: event.id, ticketTypeId: ticket.id, quantity: 2, paymentMethod: "GROW",
      guest: { name: "רון", email: "ron@test.dev" }, promoterCode: promoter.code, origin,
    });
    assert(r2.status === "paid", "promoter sale → paid");
    const res2 = await db.reservation.findUnique({ where: { id: r2.reservationId } });
    assert(res2?.promoterId === promoter.id, "reservation attributed to promoter");
    assert(res2?.promoterCommissionAgorot === 2000, "commission = 10% of 20000 = 2000ag");

    // ---------- Phase 4: sale windows ----------
    console.log("\n[P4] Ticket sale windows enforced");
    const future = await db.ticketType.create({
      data: { eventId: event.id, kind: "VIP", label: "עתידי", priceAgorot: 5000, salesStartAt: new Date(Date.now() + 86400000) },
    });
    const past = await db.ticketType.create({
      data: { eventId: event.id, kind: "VIP", label: "פג", priceAgorot: 5000, salesEndAt: new Date(Date.now() - 86400000) },
    });
    const inactive = await db.ticketType.create({
      data: { eventId: event.id, kind: "VIP", label: "כבוי", priceAgorot: 5000, active: false },
    });
    const blocked = async (tid: string, why: string) => {
      let threw = false;
      try {
        await initiate({ eventId: event.id, ticketTypeId: tid, quantity: 1, paymentMethod: "GROW", guest: { name: "x" }, origin });
      } catch { threw = true; }
      assert(threw, why);
    };
    await blocked(future.id, "future sale window blocked");
    await blocked(past.id, "expired sale window blocked");
    await blocked(inactive.id, "inactive ticket blocked");

    // ---------- Phase 5: Bar POS ----------
    console.log("\n[P5] Bar POS (card + wallet)");
    const beer = await db.foodMenuItem.create({ data: { venueId: venue.id, name: "בירה", category: "DRINK", priceAgorot: 3200 } });
    const shot = await db.foodMenuItem.create({ data: { venueId: venue.id, name: "שוט", category: "DRINK", priceAgorot: 2500 } });

    const bar1 = await createBarOrder({ venueId: venue.id, items: [{ id: beer.id, qty: 2 }, { id: shot.id, qty: 1 }] });
    assert(bar1.subtotalAgorot === 3200 * 2 + 2500, "bar subtotal computed from menu (8900ag)");
    assert(bar1.status === "PENDING_PAYMENT", "bar order PENDING_PAYMENT");
    const pay1: any = await payBarOrder({ orderId: bar1.id, method: "CARD", userId: null, origin });
    assert(pay1.status === "paid", "card pay (demo) → paid");
    const bar1After = await db.barOrder.findUnique({ where: { id: bar1.id } });
    assert(bar1After?.status === "PAID" && bar1After.cardChargedAgorot === 8900, "bar PAID, full card charge");

    // Wallet pay
    const user = await db.user.create({ data: { email: tag + "@u.dev", name: "Wallet User" } });
    const card = await db.clubItCard.create({ data: { userId: user.id, cardNumberLast4: "1234", displayName: "WU" } });
    await db.userBalance.create({ data: { cardId: card.id, venueId: venue.id, creditsBalance: 50000, creditsAccrued: 50000 } });
    const bar2 = await createBarOrder({ venueId: venue.id, items: [{ id: beer.id, qty: 1 }] });
    const pay2: any = await payBarOrder({ orderId: bar2.id, method: "WALLET", userId: user.id, origin });
    assert(pay2.status === "paid", "wallet pay (credits cover full) → paid");
    const bar2After = await db.barOrder.findUnique({ where: { id: bar2.id } });
    assert(bar2After?.creditsApplied === 3200 && bar2After.paymentMethod === "CREDITS", "wallet applied 3200 credits");
    const bal = await db.userBalance.findUnique({ where: { cardId_venueId: { cardId: card.id, venueId: venue.id } } });
    assert(bal?.creditsBalance === 50000 - 3200, "wallet balance decremented");

    // ---------- Phase 6: payouts ----------
    console.log("\n[P6] Net payout balance + settlement");
    const allTxns = await db.transaction.findMany({ where: { venueId: venue.id } });
    // Expected gross = PAID, non-wallet charges (excludes the refunded order + wallet credits).
    const expectedGross = allTxns
      .filter((t) => t.status === "PAID" && t.paymentProvider !== "wallet")
      .reduce((s, t) => s + Math.max(0, t.amountAgorot), 0);
    const refundedExcluded = allTxns.some((t) => t.status === "REFUNDED");
    const walletExcluded = allTxns.some((t) => t.paymentProvider === "wallet" && t.status === "PAID");
    assert(refundedExcluded && walletExcluded, "ledger has a refunded order + a wallet order to exclude");
    const balance = await computeVenueBalance(venue.id);
    assert(balance.gross === expectedGross, `gross = charged revenue, excludes refunds + wallet (${balance.gross})`);
    assert(balance.commission === Math.round(balance.gross * 0.1), "commission = 10% of gross");
    assert(balance.net === balance.gross - balance.commission, "net = gross − commission");

    const settlement = await settleVenue({ venueId: venue.id, settledBy: "test", bankRef: "REF-1" });
    assert(settlement.netAgorot === balance.net, "settlement snapshots net");
    const after = await computeVenueBalance(venue.id);
    assert(after.net === 0 && after.gross === 0, "balance resets to 0 after settlement");

    console.log("\n✅ ALL PHASE 2–6 CHECKS PASSED");
  } catch (e) {
    failed = true;
    console.error("\n❌", e);
  } finally {
    await db.ticketInstance.deleteMany({ where: { venueId: venue.id } });
    await db.barOrder.deleteMany({ where: { venueId: venue.id } });
    await db.transaction.deleteMany({ where: { venueId: venue.id } });
    await db.creditLedger.deleteMany({ where: { venueId: venue.id } });
    await db.userBalance.deleteMany({ where: { venueId: venue.id } });
    await db.settlement.deleteMany({ where: { venueId: venue.id } });
    await db.reservation.deleteMany({ where: { venueId: venue.id } });
    await db.promoter.deleteMany({ where: { venueId: venue.id } });
    const evs = await db.event.findMany({ where: { venueId: venue.id }, select: { id: true } });
    await db.ticketType.deleteMany({ where: { eventId: { in: evs.map((e) => e.id) } } });
    await db.foodMenuItem.deleteMany({ where: { venueId: venue.id } });
    await db.event.deleteMany({ where: { venueId: venue.id } });
    await db.venueSettings.deleteMany({ where: { venueId: venue.id } });
    await db.user.deleteMany({ where: { email: { startsWith: tag } } });
    await db.venue.delete({ where: { id: venue.id } });
    await db.$disconnect();
  }
  if (failed) process.exit(1);
}

main();
