import { requireVenueSession } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatePromoterButton } from "./create-promoter-button";
import { PromoterLinks } from "./promoter-links";

export default async function PromotersPage() {
  const { venue } = await requireVenueSession();

  const promoters = await db.promoter.findMany({
    where: { venueId: venue.id },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  // Aggregate PAID sales + commission per promoter.
  const stats = await db.reservation.groupBy({
    by: ["promoterId"],
    where: { venueId: venue.id, status: "PAID", promoterId: { not: null } },
    _sum: { amountAgorot: true, promoterCommissionAgorot: true },
    _count: { _all: true },
  });
  const byPromoter = new Map(stats.map((s) => [s.promoterId, s]));

  // Events available for tracking links (published / upcoming).
  const events = await db.event.findMany({
    where: { venueId: venue.id, status: { not: "ENDED" } },
    orderBy: { startsAt: "asc" },
    select: { id: true, name: true },
    take: 50,
  });

  const totalCommission = stats.reduce((s, x) => s + (x._sum.promoterCommissionAgorot ?? 0), 0);
  const totalSales = stats.reduce((s, x) => s + (x._sum.amountAgorot ?? 0), 0);

  return (
    <div className="crm-page-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">יחצנים</h1>
          <p className="text-sm text-ink-muted">
            {promoters.length} יחצנים · מכירות {formatILS(totalSales)} · עמלות {formatILS(totalCommission)}
          </p>
        </div>
        <CreatePromoterButton />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-soft">
              <tr className="text-right text-xs text-ink-muted uppercase tracking-wider border-b border-line">
                <th className="px-5 py-3">יחצן</th>
                <th className="px-5 py-3">עמלה</th>
                <th className="px-5 py-3">מכירות</th>
                <th className="px-5 py-3">עמלה שנצברה</th>
                <th className="px-5 py-3">סטטוס</th>
                <th className="px-5 py-3 text-left">לינק מעקב</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {promoters.map((p) => {
                const s = byPromoter.get(p.id);
                return (
                  <tr key={p.id} className="hover:bg-bg-soft transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-ink">{p.name}</div>
                      <div className="text-xs text-ink-muted font-mono">{p.code}</div>
                    </td>
                    <td className="px-5 py-3 text-ink">{p.commissionPct}%</td>
                    <td className="px-5 py-3 text-ink">
                      {formatILS(s?._sum.amountAgorot ?? 0)}
                      <span className="text-xs text-ink-muted"> · {s?._count._all ?? 0} מכירות</span>
                    </td>
                    <td className="px-5 py-3 text-gold">{formatILS(s?._sum.promoterCommissionAgorot ?? 0)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={p.active ? "success" : "default"}>
                        {p.active ? "פעיל" : "מושבת"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-left">
                      <PromoterLinks code={p.code} events={events} />
                    </td>
                  </tr>
                );
              })}
              {promoters.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-muted">
                    אין יחצנים עדיין — צור/י את הראשון
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
