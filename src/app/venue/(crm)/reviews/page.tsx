import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { timeAgoHe } from "@/lib/utils";
import { parseJson } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewRowActions } from "./row-actions";

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  ambiance: { label: "אווירה", emoji: "✨" },
  music: { label: "מוזיקה", emoji: "🎧" },
  service: { label: "שירות", emoji: "🤝" },
  value: { label: "תמורה", emoji: "💸" },
  bars: { label: "ברים", emoji: "🥃" },
};

export default async function ReviewsPage() {
  const venue = await requireVenue();
  const reviews = await db.venueReview.findMany({
    where: { venueId: venue.id },
    include: { user: true, event: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length
    : 0;
  const dist = [1, 2, 3, 4, 5].map((s) => reviews.filter((r) => r.stars === s).length);

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">דירוגים</h1>
        <p className="text-sm text-ink-muted">משוב מהבליינים אחרי הערב</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="text-xs text-ink-muted uppercase tracking-wider">ציון ממוצע</div>
          <div className="font-display text-4xl text-gold">{avg.toFixed(1)} ★</div>
        </div>
        <div className="kpi-card">
          <div className="text-xs text-ink-muted uppercase tracking-wider">סה״כ דירוגים</div>
          <div className="font-display text-4xl text-ink">{reviews.length}</div>
        </div>
        <Card className="p-5">
          <div className="text-xs text-ink-muted uppercase tracking-wider mb-2">התפלגות</div>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((s) => {
              const c = dist[s - 1];
              const pct = reviews.length ? (c / reviews.length) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="text-gold w-8">{s}★</span>
                  <div className="flex-1 h-2 bg-bg-soft rounded overflow-hidden">
                    <div className="h-full bg-gold-gradient" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-ink-muted w-8 text-left">{c}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => {
          const cats = parseJson<Record<string, number | string>>(r.categories, {});
          return (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{r.user.name ?? "אנונימי"}</span>
                    <span className="text-gold">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                  </div>
                  <div className="text-xs text-ink-muted">
                    {timeAgoHe(r.createdAt)}{r.event ? ` · ${r.event.name}` : ""}
                  </div>
                </div>
                <ReviewRowActions reviewId={r.id} status={r.crmStatus} />
              </div>
              {Object.keys(cats).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(cats).map(([k, v]) => (
                    <span key={k} className="chip">
                      {CATEGORY_LABELS[k]?.emoji} {CATEGORY_LABELS[k]?.label ?? k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}
              {r.comment && (
                <p className="text-ink leading-relaxed text-sm">{r.comment}</p>
              )}
            </Card>
          );
        })}
        {reviews.length === 0 && (
          <Card className="p-12 text-center text-ink-muted">עדיין אין דירוגים</Card>
        )}
      </div>
    </div>
  );
}
