import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateHe, formatTimeHe, formatILS } from "@/lib/utils";
import { Calendar, MapPin, Users, Clock, XCircle } from "lucide-react";
import { PayButton } from "./pay-button";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { event: true, venue: true },
  });
  if (!reservation) notFound();

  // Already paid → go straight to the ticket.
  if (reservation.status === "PAID") redirect(`/tickets/${id}`);

  const tokenOk = Boolean(t) && reservation.paymentToken === t;
  const expired =
    reservation.paymentExpiresAt != null &&
    reservation.paymentExpiresAt.getTime() < Date.now();
  const awaitingPayment = reservation.status === "PENDING_PAYMENT";

  if (!tokenOk || !awaitingPayment || expired) {
    return (
      <div className="mobile-screen pb-10">
        <div className="px-5 pt-16 text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-red-500/10 border border-red-500/40 items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="font-display text-2xl text-ink mb-2">לינק התשלום אינו תקף</h1>
          <p className="text-sm text-ink-muted">
            {expired
              ? "פג תוקף לינק התשלום. פנה/י למארגן/ת לקבלת לינק חדש."
              : reservation.status === "REJECTED"
              ? "ההזמנה נדחתה בסלקציה."
              : reservation.status === "PENDING_APPROVAL"
              ? "ההזמנה עדיין ממתינה לאישור המארגן/ת."
              : "הקישור שגוי או שההזמנה כבר טופלה."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-screen pb-10">
      <div className="px-5 pt-12 pb-6 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-gold/10 border border-gold/40 items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-display text-2xl text-gold mb-2">אושרת! 🎉</h1>
        <p className="text-sm text-ink-muted">השלמת התשלום לקבלת הכרטיס</p>
      </div>

      <div className="px-5">
        <div className="card-elevated overflow-hidden">
          <div className="p-5 space-y-3 text-sm">
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
              <div className="text-ink">
                {reservation.quantity} {reservation.quantity === 1 ? "כרטיס" : "כרטיסים"}
              </div>
            </Row>
          </div>
          <div className="bg-gold/10 border-t border-gold/30 px-5 py-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-gold">סה״כ לתשלום</span>
            <span className="font-display text-xl text-gold">{formatILS(reservation.totalAgorot)}</span>
          </div>
        </div>

        <PayButton reservationId={id} token={t!} />
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
