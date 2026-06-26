import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { reconcileGrowProcess, issueTicketInstances } from "@/lib/checkout";
import { makeQrDataUrl } from "@/lib/qr";
import Link from "next/link";
import { formatDateHe, formatTimeHe, formatILS } from "@/lib/utils";
import { Check, Calendar, MapPin, Users } from "lucide-react";
import { RideHomeCard } from "@/components/taxi-buttons";
import { TicketActions } from "./ticket-actions";

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { id } = await params;
  const { source } = await searchParams;

  // Grow's success redirect carries no transaction details, so reconcile here
  // as a fallback (no-ops unless this is a pending Grow reservation) — the
  // server-to-server webhook is the primary confirmation path.
  await reconcileGrowProcess(id);

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { event: { include: { venue: true } }, venue: true, user: true },
  });
  if (!reservation) notFound();

  // One QR per seat. Ensure instances exist for paid orders (idempotent),
  // then render each. Falls back to the order code for unpaid/legacy rows.
  let instances: { code: string; seat: number; status: string }[] = [];
  if (reservation.status === "PAID") {
    instances = await issueTicketInstances(reservation.id);
  }
  if (instances.length === 0) {
    instances = [{ code: reservation.ticketCode, seat: 1, status: "VALID" }];
  }
  const qrs = await Promise.all(
    instances.map(async (t) => ({ ...t, qr: await makeQrDataUrl(t.code) }))
  );
  const usedClubIt = source === "club-it" || reservation.paymentMethod === "CLUB_IT";

  return (
    <div className="mobile-screen pb-10">
      <div className="px-5 pt-12 pb-6 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-gold/10 border border-gold/40 items-center justify-center mb-4">
          <Check className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-display text-2xl text-gold mb-2">תשלום אושר!</h1>
        <p className="text-sm text-ink-muted">
          {usedClubIt && (
            <>
              <span className="text-gold">+{reservation.creditsEarned} קרדיטים</span> · 
            </>
          )}
          {" "}{formatILS(reservation.totalAgorot)}
        </p>
      </div>

      {/* Digital ticket(s) — one QR per seat */}
      <div className="px-5">
        <div className="card-elevated overflow-hidden">
          <div className="p-5 space-y-3 text-sm border-b border-line">
            <Row icon={<Calendar className="w-4 h-4" />}>
              <div className="font-semibold text-ink">{reservation.event.name}</div>
              <div className="text-ink-muted">
                {formatDateHe(reservation.event.startsAt)} · {formatTimeHe(reservation.event.startsAt)}
              </div>
            </Row>
            <Row icon={<MapPin className="w-4 h-4" />}>
              <div className="font-semibold text-ink">{reservation.venue.name}</div>
              <div className="text-ink-muted">{reservation.venue.address}</div>
            </Row>
            <Row icon={<Users className="w-4 h-4" />}>
              <div className="text-ink">{reservation.quantity} {reservation.quantity === 1 ? "אדם" : "אנשים"}</div>
            </Row>
          </div>
          {qrs.map((t) => (
            <div key={t.code} className="p-5 border-b border-line last:border-b-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-widest text-gold">
                  כרטיס {t.seat} מתוך {reservation.quantity}
                </span>
                <span className="font-mono text-xs text-ink-muted">
                  {t.code.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-center">
                <img
                  src={t.qr}
                  alt={`QR ${t.seat}`}
                  width={220}
                  height={220}
                  className={`rounded-lg border border-gold/20 bg-bg p-2 ${
                    t.status === "CHECKED_IN" ? "opacity-40 grayscale" : ""
                  }`}
                />
              </div>
              {t.status === "CHECKED_IN" && (
                <p className="text-center text-xs text-ink-muted mt-2">כרטיס זה כבר נוצל ✓</p>
              )}
            </div>
          ))}
        </div>

        <TicketActions
          reservationId={reservation.id}
          defaultEmail={reservation.user?.email ?? reservation.guestEmail}
        />

        {/* Ride Home (Part IV - shown after payment) */}
        {reservation.venue.lat && reservation.venue.lng && (
          <div className="mt-5">
            <RideHomeCard
              venueLat={reservation.venue.lat}
              venueLng={reservation.venue.lng}
              venueName={reservation.venue.name}
            />
          </div>
        )}

        {/* Suggest Club-it after purchase if user doesn't have one */}
        {!usedClubIt && reservation.userId && (
          <Link
            href={`/club-it?from=ticket&reservationId=${reservation.id}`}
            className="mt-5 block rounded-xl border border-gold/40 bg-gold/10 p-4 text-center"
          >
            <div className="font-semibold text-gold mb-1">
              הנפק/י Club-it רטרואקטיבית
            </div>
            <div className="text-xs text-ink-muted">
              קבל/י קרדיטים על הקנייה הזו
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gold mt-0.5">{icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
