import { notFound } from "next/navigation";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { formatILS, formatDateHe, formatTimeHe, timeAgoHe } from "@/lib/utils";
import { parseCsv } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventActions } from "./event-actions";
import { TicketTypesManager } from "./ticket-types-manager";

export default async function VenueEventDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await requireVenue();
  const event = await db.event.findFirst({
    where: { id, venueId: venue.id },
    include: {
      tickets: { orderBy: { priceAgorot: "asc" } },
      reservations: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { reservations: true } },
    },
  });
  if (!event) notFound();

  const ticketTypes = event.tickets.map((t) => ({
    id: t.id,
    kind: t.kind,
    label: t.label,
    priceAgorot: t.priceAgorot,
    stock: t.stock,
    sold: t.sold,
    active: t.active,
    salesStartAt: t.salesStartAt ? t.salesStartAt.toISOString() : null,
    salesEndAt: t.salesEndAt ? t.salesEndAt.toISOString() : null,
  }));

  const paid = event.reservations.filter((r) => r.status === "PAID");
  const totalRevenue = paid.reduce((s, r) => s + r.totalAgorot, 0);
  const totalPeople = paid.reduce((s, r) => s + r.quantity, 0);
  const occupancy = event.capacity ? Math.round((totalPeople / event.capacity) * 100) : 0;

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">{event.name}</h1>
          <p className="text-sm text-ink-muted">
            {formatDateHe(event.startsAt)} · {formatTimeHe(event.startsAt)}
          </p>
        </div>
        <EventActions
          eventId={event.id}
          status={event.status}
          approvalPolicy={event.approvalPolicy}
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="הזמנות" value={paid.length.toString()} />
        <Kpi label="סה״כ אנשים" value={totalPeople.toString()} />
        <Kpi label="הכנסה" value={formatILS(totalRevenue)} accent="gold" />
        <Kpi label="ניצול תפוסה" value={`${occupancy}%`} ring={occupancy} />
      </div>

      <Card className="p-5">
        <TicketTypesManager eventId={event.id} tickets={ticketTypes} />
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Details panel */}
        <Card className="p-5 col-span-1">
          <h3 className="font-semibold text-ink mb-3">פרטים</h3>
          <dl className="space-y-3 text-sm">
            <DefRow label="מחיר בסיס" value={formatILS(event.basePriceAgorot)} />
            <DefRow label="תפוסה משוערת" value={event.capacity.toString()} />
            <DefRow
              label="אישור כרטיסים"
              value={event.approvalPolicy === "MANUAL" ? "ידני (סלקציה)" : "אוטומטי"}
            />
            <DefRow label="ז'אנרים" value={parseCsv(event.genres).join(", ") || "—"} />
            <DefRow label="תיאור">
              <p className="text-ink leading-relaxed">{event.description || "—"}</p>
            </DefRow>
          </dl>
        </Card>

        {/* Reservations table */}
        <Card className="p-5 col-span-2 overflow-hidden">
          <h3 className="font-semibold text-ink mb-3">הזמנות ({event.reservations.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-muted uppercase tracking-wider">
                <tr className="text-right border-b border-line">
                  <th className="py-2">לקוח</th>
                  <th className="py-2">טלפון</th>
                  <th className="py-2">אנשים</th>
                  <th className="py-2">סכום</th>
                  <th className="py-2">קרדיטים</th>
                  <th className="py-2">סטטוס</th>
                  <th className="py-2 text-left">זמן</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {event.reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 text-ink">
                      {r.user?.name ?? r.guestName ?? "אורח"}
                    </td>
                    <td className="py-3 text-ink-muted">
                      {r.user?.phone ?? r.guestPhone ?? "—"}
                    </td>
                    <td className="py-3 text-ink">{r.quantity}</td>
                    <td className="py-3 text-ink">{formatILS(r.totalAgorot)}</td>
                    <td className="py-3 text-emerald-400">+{r.creditsEarned}</td>
                    <td className="py-3">
                      <Badge variant={resStatusVariant(r.status)}>
                        {resStatusLabel(r.status)}
                      </Badge>
                    </td>
                    <td className="py-3 text-ink-muted text-xs text-left">
                      {timeAgoHe(r.createdAt)}
                    </td>
                  </tr>
                ))}
                {event.reservations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-muted">
                      אין הזמנות עדיין
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  ring,
}: {
  label: string;
  value: string;
  accent?: "gold";
  ring?: number;
}) {
  return (
    <div className="kpi-card">
      {ring !== undefined && (
        <div className="absolute top-3 left-3">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" stroke="#23232F" strokeWidth="3" fill="none" />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#D4AF37"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              transform="rotate(-90 24 24)"
              strokeDasharray={`${(Math.min(ring, 100) / 100) * 125.6} 125.6`}
            />
          </svg>
        </div>
      )}
      <div className="text-xs text-ink-muted uppercase tracking-wider">{label}</div>
      <div className={`font-display text-2xl ${accent === "gold" ? "text-gold" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function resStatusVariant(s: string): "success" | "warn" | "danger" | "default" {
  if (s === "PAID") return "success";
  if (s === "PENDING_APPROVAL" || s === "PENDING_PAYMENT" || s === "PENDING") return "warn";
  if (s === "FAILED" || s === "REJECTED" || s === "EXPIRED") return "danger";
  return "default";
}

function resStatusLabel(s: string) {
  return (
    {
      PENDING_APPROVAL: "ממתין לאישור",
      PENDING_PAYMENT: "ממתין לתשלום",
      PAID: "שולם",
      PENDING: "ממתין",
      FAILED: "נכשל",
      REJECTED: "נדחה",
      EXPIRED: "פג תוקף",
      REFUNDED: "הוחזר",
      CANCELLED: "בוטל",
    }[s] ?? s
  );
}

function DefRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="text-ink-muted w-32 shrink-0">{label}</dt>
      <dd className="text-ink flex-1">{children ?? value}</dd>
    </div>
  );
}
