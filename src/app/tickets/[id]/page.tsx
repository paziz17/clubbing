import { notFound } from "next/navigation";
import { db } from "@/lib/db";
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
  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { event: { include: { venue: true } }, venue: true, user: true },
  });
  if (!reservation) notFound();

  const qr = await makeQrDataUrl(reservation.ticketCode);
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

      {/* Digital ticket */}
      <div className="px-5">
        <div className="card-elevated overflow-hidden">
          <div className="bg-gold/10 border-b border-gold/30 px-5 py-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-gold">כרטיס דיגיטלי</span>
            <span className="font-mono text-xs text-ink-muted">
              {reservation.ticketCode.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="p-5">
            <div className="flex justify-center mb-5">
              <img
                src={qr}
                alt="QR"
                width={240}
                height={240}
                className="rounded-lg border border-gold/20 bg-bg p-2"
              />
            </div>
            <div className="space-y-3 text-sm">
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
          </div>
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
