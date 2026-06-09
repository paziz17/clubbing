import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { formatILS, formatCredits, formatDateHe, formatTimeHe } from "@/lib/utils";
import { CreditCard, TrendingUp, Coins, ArrowDownLeft } from "lucide-react";

export default async function TransactionsPage() {
  const venue = await requireVenue();
  const txns = await db.transaction.findMany({
    where: { venueId: venue.id },
    include: { user: true, reservation: { include: { event: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const revenue    = txns.filter(t => t.amountAgorot > 0).reduce((s, t) => s + t.amountAgorot, 0);
  const credEarned = txns.reduce((s, t) => s + Math.max(0, t.creditsDelta), 0);
  const credSpent  = txns.reduce((s, t) => s + Math.abs(Math.min(0, t.creditsDelta)), 0);
  const avgTxn     = txns.length ? Math.round(revenue / txns.length) : 0;

  const methodLabel: Record<string, string> = {
    STRIPE_CARD: "כרטיס אשראי", APPLE_PAY: "Apple Pay", GOOGLE_PAY: "Google Pay",
    CLUB_IT: "Club-It", CREDITS: "קרדיטים", MIXED: "משולב", DEMO: "דמו",
  };

  return (
    <div className="min-h-screen">
      <header className="crm-page-header">
        <div>
          <h1 className="text-xl font-semibold text-ink">עסקאות ותשלומים</h1>
          <p className="text-xs text-ink-muted mt-0.5">{txns.length} רשומות</p>
        </div>
        <button className="btn-ghost h-9 px-4 text-sm">ייצוא CSV</button>
      </header>

      <div className="crm-page-body">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card accent-gold">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted uppercase tracking-wide">הכנסה כוללת</span>
              <TrendingUp className="w-4 h-4 text-gold opacity-60" />
            </div>
            <div className="font-display text-2xl text-gold">{formatILS(revenue)}</div>
            <div className="text-xs text-ink-dim">{txns.length} עסקאות</div>
          </div>
          <div className="stat-card accent-blue">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted uppercase tracking-wide">ממוצע עסקה</span>
              <CreditCard className="w-4 h-4 text-blue-400 opacity-60" />
            </div>
            <div className="font-display text-2xl text-blue-400">{formatILS(avgTxn)}</div>
          </div>
          <div className="stat-card accent-green">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted uppercase tracking-wide">קרדיטים נצברו</span>
              <Coins className="w-4 h-4 text-emerald-400 opacity-60" />
            </div>
            <div className="font-display text-2xl text-emerald-400">{formatCredits(credEarned)}</div>
          </div>
          <div className="stat-card accent-purple">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted uppercase tracking-wide">קרדיטים מומשו</span>
              <ArrowDownLeft className="w-4 h-4 text-purple-400 opacity-60" />
            </div>
            <div className="font-display text-2xl text-purple-400">{formatCredits(credSpent)}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-bg-card border border-line rounded-xl overflow-hidden">
          <table className="crm-table">
            <thead>
              <tr>
                <th>תאריך ושעה</th>
                <th>לקוח</th>
                <th>אירוע</th>
                <th>אמצעי תשלום</th>
                <th>סכום</th>
                <th>קרדיטים</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id}>
                  <td className="text-ink-muted text-xs whitespace-nowrap">
                    {formatDateHe(t.createdAt)}&nbsp;·&nbsp;{formatTimeHe(t.createdAt)}
                  </td>
                  <td>
                    <span className="font-medium text-ink">{t.user?.name ?? "אורח"}</span>
                  </td>
                  <td className="text-ink-muted max-w-[180px] truncate">
                    {t.reservation?.event.name ?? "—"}
                  </td>
                  <td>
                    <span className="chip text-[10px]">
                      {methodLabel[t.paymentMethod] ?? t.paymentMethod}
                    </span>
                  </td>
                  <td className={`font-semibold ${t.amountAgorot < 0 ? "text-danger" : "text-gold"}`}>
                    {t.amountAgorot < 0 ? "-" : ""}{formatILS(Math.abs(t.amountAgorot))}
                  </td>
                  <td className={`text-sm ${t.creditsDelta < 0 ? "text-danger" : "text-emerald-400"}`}>
                    {t.creditsDelta > 0 ? "+" : ""}{formatCredits(t.creditsDelta)}
                  </td>
                  <td>
                    <StatusPill status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    PENDING: "bg-warn/15 text-warn border-warn/30",
    FAILED:  "bg-danger/15 text-danger border-danger/30",
  };
  const labels: Record<string, string> = { PAID: "שולם", PENDING: "ממתין", FAILED: "נכשל", REFUNDED: "הוחזר" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? "bg-bg-soft text-ink-muted border-line"}`}>
      {labels[status] ?? status}
    </span>
  );
}
