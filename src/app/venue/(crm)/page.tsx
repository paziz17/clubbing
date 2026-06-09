import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { formatILS, formatCredits, formatDateHe, timeAgoHe } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChartDailyRevenue } from "@/components/chart-daily-revenue";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Ticket,
  CreditCard,
  Calendar,
  Star,
  ChevronLeft,
  ArrowUpRight,
  Clock,
  Radio,
} from "lucide-react";

export default async function VenueDashboard() {
  const venue = await requireVenue();

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since7  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);
  const since60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    txns30, txns7, txnsPrev30,
    upcomingResCount, activeCustomers,
    upcomingEvents, recentReservations,
    recentReviews, pendingApplications,
    topEvents,
  ] = await Promise.all([
    db.transaction.findMany({ where: { venueId: venue.id, createdAt: { gte: since30 }, status: "PAID" } }),
    db.transaction.findMany({ where: { venueId: venue.id, createdAt: { gte: since7 },  status: "PAID" } }),
    db.transaction.findMany({ where: { venueId: venue.id, createdAt: { gte: since60, lt: since30 }, status: "PAID" } }),
    db.reservation.count({ where: { venueId: venue.id, status: "PAID", event: { startsAt: { gte: now } } } }),
    db.reservation.findMany({ where: { venueId: venue.id, status: "PAID", userId: { not: null } }, select: { userId: true }, distinct: ["userId"] }).then(r => r.length),
    db.event.findMany({
      where: { venueId: venue.id, startsAt: { gte: now }, status: "PUBLISHED" },
      orderBy: { startsAt: "asc" }, take: 6,
      include: { _count: { select: { reservations: true } }, tickets: true },
    }),
    db.reservation.findMany({
      where: { venueId: venue.id },
      include: { event: true, user: true },
      orderBy: { createdAt: "desc" }, take: 10,
    }),
    db.venueReview.findMany({
      where: { venueId: venue.id, crmStatus: "UNREAD" },
      include: { user: true, event: true },
      orderBy: { createdAt: "desc" }, take: 4,
    }),
    db.exclusiveApplication.count({ where: { venueId: venue.id, status: "PENDING" } }),
    db.event.findMany({
      where: { venueId: venue.id, status: "ENDED" },
      include: { _count: { select: { reservations: true } }, tickets: true },
      orderBy: { startsAt: "desc" }, take: 5,
    }),
  ]);

  // KPI calculations
  const rev30   = txns30.reduce((s, t) => s + Math.max(0, t.amountAgorot), 0);
  const rev7    = txns7.reduce((s,  t) => s + Math.max(0, t.amountAgorot), 0);
  const revPrev = txnsPrev30.reduce((s, t) => s + Math.max(0, t.amountAgorot), 0);
  const revDelta = revPrev > 0 ? Math.round(((rev30 - revPrev) / revPrev) * 100) : 0;
  const credits30 = txns30.reduce((s, t) => s + Math.max(0, t.creditsDelta), 0);
  const avgTxn   = txns30.length ? Math.round(rev30 / txns30.length) : 0;

  // Daily chart
  const daily: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    daily[d.toISOString().slice(0, 10)] = 0;
  }
  for (const t of txns30) {
    const k = t.createdAt.toISOString().slice(0, 10);
    if (k in daily) daily[k] += Math.max(0, t.amountAgorot);
  }
  const series = Object.entries(daily).map(([date, amount]) => ({ date, amount }));

  // Average review score
  const allReviews = await db.venueReview.findMany({ where: { venueId: venue.id }, select: { stars: true } });
  const avgStars = allReviews.length ? (allReviews.reduce((s, r) => s + r.stars, 0) / allReviews.length).toFixed(1) : "—";

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="crm-page-header">
        <div>
          <h1 className="text-xl font-semibold text-ink">דשבורד</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {venue.name} · {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingApplications > 0 && (
            <Link href="/venue/selection" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warn/10 border border-warn/30 text-warn text-xs font-medium hover:bg-warn/15 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              {pendingApplications} בקשות סלקציה
            </Link>
          )}
          {recentReviews.length > 0 && (
            <Link href="/venue/reviews" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/25 text-gold text-xs font-medium hover:bg-gold/15 transition-colors">
              <Star className="w-3 h-3" />
              {recentReviews.length} ביקורות חדשות
            </Link>
          )}
          <Link href="/venue/live" className="btn-gold h-9 px-4 text-sm flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" />
            ערב חי
          </Link>
        </div>
      </header>

      <div className="crm-page-body">
        {/* ── KPI ROW ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="הכנסות 30 יום"
            value={formatILS(rev30)}
            sub={`${txns30.length} עסקאות`}
            accent="gold"
            delta={revDelta}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            label="הכנסות שבוע"
            value={formatILS(rev7)}
            sub={`${txns7.length} עסקאות`}
            accent="blue"
            icon={<CreditCard className="w-4 h-4" />}
          />
          <StatCard
            label="הזמנות עתידיות"
            value={upcomingResCount.toString()}
            sub="מקומות שמורים"
            accent="green"
            icon={<Ticket className="w-4 h-4" />}
          />
          <StatCard
            label="לקוחות פעילים"
            value={activeCustomers.toString()}
            sub="רשומים"
            accent="purple"
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            label="קרדיטים נצברו"
            value={formatCredits(credits30)}
            sub="30 ימים"
            accent="orange"
            icon={<Star className="w-4 h-4" />}
          />
          <StatCard
            label="ממוצע עסקה"
            value={formatILS(avgTxn)}
            sub={`דירוג: ${avgStars} ⭐`}
            accent="rose"
            icon={<ArrowUpRight className="w-4 h-4" />}
          />
        </div>

        {/* ── CHART + UPCOMING EVENTS ──────────────── */}
        <div className="grid grid-cols-3 gap-5">
          {/* Chart — 2 cols */}
          <div className="col-span-2 bg-bg-card border border-line rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink">הכנסות יומיות — 30 ימים אחרונים</h2>
              <span className="text-xs text-ink-muted bg-bg-soft px-2 py-1 rounded">
                סה״כ {formatILS(rev30)}
              </span>
            </div>
            <ChartDailyRevenue data={series} />
          </div>

          {/* Upcoming events — 1 col */}
          <div className="bg-bg-card border border-line rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                אירועים קרובים
              </h2>
              <Link href="/venue/events" className="text-xs text-gold hover:underline flex items-center gap-0.5">
                הכל <ChevronLeft className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2 flex-1">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-ink-muted py-4 text-center">אין אירועים מתוכננים</p>
              ) : (
                upcomingEvents.map((e) => {
                  const sold = e.tickets.reduce((s, t) => s + t.sold, 0);
                  const cap  = e.capacity || 1;
                  const pct  = Math.min(100, Math.round((sold / cap) * 100));
                  return (
                    <Link
                      key={e.id}
                      href={`/venue/events/${e.id}`}
                      className="block p-3 rounded-lg bg-bg-soft hover:bg-bg-elevated transition-colors border border-transparent hover:border-gold/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink text-sm truncate ml-2">{e.name}</span>
                        <span className="text-xs text-gold font-semibold flex-shrink-0">{e._count.reservations}</span>
                      </div>
                      <div className="text-xs text-ink-muted mt-1">{formatDateHe(e.startsAt)}</div>
                      <div className="mt-2 h-1 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-gradient rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-line">
              <Link href="/venue/events" className="btn-ghost w-full justify-center text-xs h-8 px-3">
                + הוסף אירוע
              </Link>
            </div>
          </div>
        </div>

        {/* ── RESERVATIONS + REVIEWS ───────────────── */}
        <div className="grid grid-cols-5 gap-5">
          {/* Recent reservations — 3 cols */}
          <div className="col-span-3 bg-bg-card border border-line rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="font-semibold text-ink flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gold" />
                הזמנות אחרונות
              </h2>
              <Link href="/venue/reservations" className="text-xs text-gold hover:underline">
                לכולן ←
              </Link>
            </div>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>לקוח</th>
                  <th>אירוע</th>
                  <th>סכום</th>
                  <th>סטטוס</th>
                  <th>לפני</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={r.user?.name ?? r.guestName ?? "?"} />
                        <span className="font-medium">{r.user?.name ?? r.guestName ?? "אורח"}</span>
                      </div>
                    </td>
                    <td className="text-ink-muted max-w-[140px] truncate">{r.event.name}</td>
                    <td className="font-semibold text-gold">{formatILS(r.totalAgorot)}</td>
                    <td><ResBadge status={r.status} /></td>
                    <td className="text-ink-dim text-xs">{timeAgoHe(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent reviews — 2 cols */}
          <div className="col-span-2 bg-bg-card border border-line rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="font-semibold text-ink flex items-center gap-2">
                <Star className="w-4 h-4 text-gold" />
                ביקורות חדשות
              </h2>
              <Link href="/venue/reviews" className="text-xs text-gold hover:underline">
                לכולן ←
              </Link>
            </div>
            <div className="divide-y divide-line/60">
              {recentReviews.length === 0 ? (
                <p className="text-sm text-ink-muted p-5 text-center">אין ביקורות חדשות</p>
              ) : (
                recentReviews.map((r) => (
                  <div key={r.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.user?.name ?? "?"} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-ink">{r.user?.name ?? "אורח"}</div>
                          <div className="text-xs text-ink-muted truncate max-w-[120px]">{r.event?.name}</div>
                        </div>
                      </div>
                      <Stars n={r.stars} />
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-xs text-ink-muted line-clamp-2">{r.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
            {recentReviews.length > 0 && (
              <div className="px-5 py-3 border-t border-line">
                <Link href="/venue/reviews" className="btn-ghost w-full justify-center text-xs h-8 px-3">
                  לכל הביקורות
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── TOP PAST EVENTS ──────────────────────── */}
        {topEvents.length > 0 && (
          <div className="bg-bg-card border border-line rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="font-semibold text-ink">אירועים שהסתיימו — ביצועים</h2>
              <Link href="/venue/events" className="text-xs text-gold hover:underline">
                לכולם ←
              </Link>
            </div>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>שם האירוע</th>
                  <th>תאריך</th>
                  <th>הזמנות</th>
                  <th>קיבולת</th>
                  <th>אחוז מילוי</th>
                  <th>הכנסה</th>
                </tr>
              </thead>
              <tbody>
                {topEvents.map((e) => {
                  const sold = e.tickets.reduce((s, t) => s + t.sold, 0);
                  const pct  = e.capacity ? Math.min(100, Math.round((sold / e.capacity) * 100)) : 0;
                  const rev  = e.tickets.reduce((s, t) => s + t.sold * t.priceAgorot, 0);
                  return (
                    <tr key={e.id}>
                      <td>
                        <Link href={`/venue/events/${e.id}`} className="font-medium text-ink hover:text-gold transition-colors">
                          {e.name}
                        </Link>
                      </td>
                      <td className="text-ink-muted">{formatDateHe(e.startsAt)}</td>
                      <td className="font-semibold">{e._count.reservations}</td>
                      <td className="text-ink-muted">{e.capacity || "—"}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: pct > 80 ? "#22c55e" : pct > 50 ? "#d4af37" : "#f97316",
                              }}
                            />
                          </div>
                          <span className="text-xs text-ink-muted">{pct}%</span>
                        </div>
                      </td>
                      <td className="font-semibold text-gold">{formatILS(rev)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, delta, icon,
}: {
  label: string; value: string; sub?: string;
  accent: "gold" | "blue" | "green" | "purple" | "orange" | "rose";
  delta?: number; icon?: React.ReactNode;
}) {
  const accentColor: Record<string, string> = {
    gold: "text-gold", blue: "text-blue-400", green: "text-emerald-400",
    purple: "text-purple-400", orange: "text-orange-400", rose: "text-rose-400",
  };
  return (
    <div className={`stat-card accent-${accent}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted uppercase tracking-wide">{label}</span>
        <span className={`${accentColor[accent]} opacity-60`}>{icon}</span>
      </div>
      <div className={`font-display text-2xl font-bold ${accentColor[accent]}`}>{value}</div>
      <div className="flex items-center justify-between">
        {sub && <span className="text-xs text-ink-dim">{sub}</span>}
        {delta !== undefined && delta !== 0 && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${delta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className={`rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 font-semibold text-gold ${size === "sm" ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-xs"}`}>
      {initials}
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 flex-shrink-0">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xs ${i <= n ? "text-gold" : "text-ink-dim"}`}>★</span>
      ))}
    </div>
  );
}

function ResBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PAID:      { label: "שולם",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    PENDING:   { label: "ממתין",   cls: "bg-warn/15 text-warn border-warn/30" },
    FAILED:    { label: "נכשל",    cls: "bg-danger/15 text-danger border-danger/30" },
    REFUNDED:  { label: "הוחזר",   cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    CANCELLED: { label: "בוטל",    cls: "bg-ink-dim/20 text-ink-muted border-line" },
  };
  const s = map[status] ?? { label: status, cls: "bg-bg-soft text-ink-muted border-line" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.label}
    </span>
  );
}
