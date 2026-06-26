import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/utils";

export default async function PromoterDashboard({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const promoter = await db.promoter.findUnique({ where: { code } });
  if (!promoter) notFound();

  const reservations = await db.reservation.findMany({
    where: { promoterId: promoter.id, status: "PAID" },
    include: { event: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const byEvent = new Map<string, { name: string; count: number; sales: number; commission: number }>();
  for (const r of reservations) {
    const key = r.eventId;
    const row = byEvent.get(key) ?? { name: r.event.name, count: 0, sales: 0, commission: 0 };
    row.count += r.quantity;
    row.sales += r.amountAgorot;
    row.commission += r.promoterCommissionAgorot;
    byEvent.set(key, row);
  }
  const totalSales = reservations.reduce((s, r) => s + r.amountAgorot, 0);
  const totalCommission = reservations.reduce((s, r) => s + r.promoterCommissionAgorot, 0);
  const totalTickets = reservations.reduce((s, r) => s + r.quantity, 0);

  return (
    <div className="mobile-screen pb-12">
      <div className="px-5 pt-12 pb-6 text-center">
        <div className="font-display text-gold-gradient text-lg tracking-[0.2em] opacity-70 mb-2">CLUBBING</div>
        <h1 className="font-display text-2xl text-ink">{promoter.name}</h1>
        <p className="text-sm text-ink-muted">לוח יחצן · עמלה {promoter.commissionPct}%</p>
      </div>

      <div className="px-5 grid grid-cols-3 gap-3">
        <Stat label="כרטיסים" value={totalTickets.toString()} />
        <Stat label="מכירות" value={formatILS(totalSales)} />
        <Stat label="עמלה" value={formatILS(totalCommission)} accent />
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-sm text-ink-muted mb-3">לפי אירוע</h2>
        <div className="space-y-2">
          {[...byEvent.values()].map((e) => (
            <div key={e.name} className="card-elevated p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-ink">{e.name}</div>
                <div className="text-xs text-ink-muted">{e.count} כרטיסים · {formatILS(e.sales)}</div>
              </div>
              <div className="text-gold font-display text-lg">{formatILS(e.commission)}</div>
            </div>
          ))}
          {byEvent.size === 0 && (
            <p className="text-center text-ink-muted py-10">אין מכירות עדיין</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-elevated p-4 text-center">
      <div className="text-[10px] text-ink-muted uppercase tracking-wider">{label}</div>
      <div className={`font-display text-xl ${accent ? "text-gold" : "text-ink"}`}>{value}</div>
    </div>
  );
}
