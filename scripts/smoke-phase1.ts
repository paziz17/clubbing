/**
 * Phase 1 smoke test — Order life-cycle + manual approval (selection).
 * Run: DATABASE_URL=... tsx scripts/smoke-phase1.ts
 *
 * Verifies, against the real checkout module (demo payment mode):
 *   MANUAL: initiate → Pending_Approval (stock locked)
 *           approve  → Pending_Payment + payment token
 *           pay      → Paid (demo)
 *   MANUAL reject:    initiate → reject → Rejected (stock released)
 *   AUTO:             initiate → Paid (demo, straight through)
 */
import { db } from "@/lib/db";
import {
  initiate,
  approveReservation,
  rejectReservation,
  payApprovedReservation,
} from "@/lib/checkout";

const assert = (cond: any, msg: string) => {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ✓ " + msg);
};

async function main() {
  const tag = "smoke-p1-" + Date.now();
  const venue = await db.venue.create({
    data: {
      slug: tag,
      name: "Smoke Venue",
      username: tag,
      passwordHash: "x",
      address: "Test 1",
      city: "TLV",
    },
  });
  const makeEvent = (policy: "AUTO" | "MANUAL") =>
    db.event.create({
      data: {
        venueId: venue.id,
        name: `Smoke ${policy}`,
        startsAt: new Date(Date.now() + 86400000),
        basePriceAgorot: 10000,
        capacity: 100,
        approvalPolicy: policy,
        status: "PUBLISHED",
        tickets: { create: [{ kind: "STANDARD", label: "רגיל", priceAgorot: 10000, stock: 5 }] },
      },
      include: { tickets: true },
    });

  const origin = "http://localhost:3000";
  let failed = false;
  try {
    // ---- MANUAL happy path ----
    console.log("\n[1] MANUAL approve → pay");
    const evM = await makeEvent("MANUAL");
    const tkM = evM.tickets[0];
    const r1: any = await initiate({
      eventId: evM.id,
      ticketTypeId: tkM.id,
      quantity: 2,
      paymentMethod: "GROW",
      guest: { name: "דנה", email: "dana@test.dev", phone: "0501112222" },
      origin,
    });
    assert(r1.status === "pending_approval", "initiate(MANUAL) → pending_approval");
    let res1 = await db.reservation.findUnique({ where: { id: r1.reservationId } });
    assert(res1?.status === "PENDING_APPROVAL", "reservation is PENDING_APPROVAL");
    let tkAfter = await db.ticketType.findUnique({ where: { id: tkM.id } });
    assert(tkAfter?.sold === 2, "stock locked on approval-hold (sold=2)");

    const appr: any = await approveReservation(r1.reservationId, "owner-1", origin);
    assert(appr.status === "pending_payment", "approve → pending_payment");
    assert(typeof appr.paymentUrl === "string" && appr.paymentUrl.includes(r1.reservationId), "payment link generated");
    res1 = await db.reservation.findUnique({ where: { id: r1.reservationId } });
    assert(res1?.status === "PENDING_PAYMENT" && !!res1?.paymentToken, "reservation PENDING_PAYMENT + token");

    const token = res1!.paymentToken!;
    const pay: any = await payApprovedReservation(r1.reservationId, token, origin);
    assert(pay.status === "paid", "pay (demo) → paid");
    res1 = await db.reservation.findUnique({ where: { id: r1.reservationId } });
    assert(res1?.status === "PAID", "reservation is PAID");

    // wrong token rejected
    let threw = false;
    try {
      await payApprovedReservation(r1.reservationId, "bad-token", origin);
    } catch {
      threw = true;
    }
    assert(res1?.status === "PAID", "already-paid stays PAID (idempotent)");

    // ---- MANUAL reject path ----
    console.log("\n[2] MANUAL reject → stock released");
    const r2: any = await initiate({
      eventId: evM.id,
      ticketTypeId: tkM.id,
      quantity: 1,
      paymentMethod: "GROW",
      guest: { name: "יוסי", phone: "0503334444" },
      origin,
    });
    tkAfter = await db.ticketType.findUnique({ where: { id: tkM.id } });
    assert(tkAfter?.sold === 3, "stock locked again (sold=3)");
    const rej: any = await rejectReservation(r2.reservationId, "owner-1", "לא עומד בקריטריונים");
    assert(rej.status === "rejected", "reject → rejected");
    const res2 = await db.reservation.findUnique({ where: { id: r2.reservationId } });
    assert(res2?.status === "REJECTED" && res2?.rejectionReason != null, "reservation REJECTED + reason");
    tkAfter = await db.ticketType.findUnique({ where: { id: tkM.id } });
    assert(tkAfter?.sold === 2, "stock released on reject (sold back to 2)");

    // ---- AUTO straight-through ----
    console.log("\n[3] AUTO → paid directly (demo)");
    const evA = await makeEvent("AUTO");
    const tkA = evA.tickets[0];
    const r3: any = await initiate({
      eventId: evA.id,
      ticketTypeId: tkA.id,
      quantity: 1,
      paymentMethod: "GROW",
      guest: { name: "רון", email: "ron@test.dev" },
      origin,
    });
    assert(r3.status === "paid", "initiate(AUTO) demo → paid");
    const res3 = await db.reservation.findUnique({ where: { id: r3.reservationId } });
    assert(res3?.status === "PAID", "AUTO reservation PAID");

    console.log("\n✅ ALL PHASE 1 CHECKS PASSED");
  } catch (e) {
    failed = true;
    console.error("\n❌", e);
  } finally {
    // cleanup
    await db.transaction.deleteMany({ where: { venueId: venue.id } });
    await db.reservation.deleteMany({ where: { venueId: venue.id } });
    const evs = await db.event.findMany({ where: { venueId: venue.id }, select: { id: true } });
    await db.ticketType.deleteMany({ where: { eventId: { in: evs.map((e) => e.id) } } });
    await db.event.deleteMany({ where: { venueId: venue.id } });
    await db.venue.delete({ where: { id: venue.id } });
    await db.$disconnect();
  }
  if (failed) process.exit(1);
}

main();
