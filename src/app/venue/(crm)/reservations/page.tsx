import { requireVenueSession } from "@/lib/venue-session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { formatILS, formatDateHe, timeAgoHe } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReservationsFilter } from "./filter";
import { RefundButton } from "./refund-button";
import { ApprovalActions } from "./approval-actions";

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function ReservationsPage({ searchParams }: Props) {
  const { q, status } = await searchParams;
  const { venue, role } = await requireVenueSession();
  const canRefund = can(role, "refund");

  const where: any = { venueId: venue.id };
  if (status && status !== "all") where.status = status;
  if (q) {
    where.OR = [
      { guestName: { contains: q, mode: "insensitive" } },
      { guestEmail: { contains: q, mode: "insensitive" } },
      { guestPhone: { contains: q } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q } } },
    ];
  }

  const reservations = await db.reservation.findMany({
    where,
    include: { event: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalAmount = reservations.reduce((s, r) => s + r.totalAgorot, 0);
  const totalPeople = reservations.reduce((s, r) => s + r.quantity, 0);

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">הזמנות</h1>
        <p className="text-sm text-ink-muted">
          {reservations.length} הזמנות · {totalPeople} אנשים · {formatILS(totalAmount)}
        </p>
      </div>

      <ReservationsFilter />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="bg-bg-soft sticky top-0">
              <tr className="text-right text-xs text-ink-muted uppercase tracking-wider border-b border-line">
                <th className="px-5 py-3">לקוח</th>
                <th className="px-5 py-3">אירוע</th>
                <th className="px-5 py-3">אנשים</th>
                <th className="px-5 py-3">סכום</th>
                <th className="px-5 py-3">סטטוס</th>
                <th className="px-5 py-3 text-left">תאריך</th>
                <th className="px-5 py-3 text-left">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-bg-soft transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-ink">{r.user?.name ?? r.guestName ?? "אורח"}</div>
                    <div className="text-xs text-ink-muted">
                      {r.user?.phone ?? r.guestPhone ?? "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <a href={`/venue/events/${r.event.id}`} className="text-gold hover:underline">
                      {r.event.name}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-ink">{r.quantity}</td>
                  <td className="px-5 py-3 text-ink">{formatILS(r.totalAgorot)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-muted text-left">
                    {timeAgoHe(r.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-left">
                    {r.status === "PENDING_APPROVAL" && (
                      <ApprovalActions reservationId={r.id} />
                    )}
                    {canRefund && r.status === "PAID" && (
                      <RefundButton reservationId={r.id} />
                    )}
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-ink-muted">
                    אין הזמנות מתאימות
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function statusVariant(s: string): "success" | "warn" | "danger" | "default" {
  if (s === "PAID") return "success";
  if (s === "PENDING_APPROVAL" || s === "PENDING_PAYMENT" || s === "PENDING") return "warn";
  if (s === "FAILED" || s === "REJECTED" || s === "EXPIRED") return "danger";
  return "default";
}

function statusLabel(s: string) {
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
