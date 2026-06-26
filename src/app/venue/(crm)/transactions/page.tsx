import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { formatILS, formatCredits, formatDateHe, formatTimeHe } from "@/lib/utils";
import { CreditCard, TrendingUp, Coins, ArrowDownLeft, Wallet, Scissors, Banknote } from "lucide-react";
import { computeVenueBalance, listSettlements } from "@/lib/payouts";
import { ExportCsvButton, type CsvRow } from "./export-csv-button";

export default async function TransactionsPage() {
  const venue = await requireVenue();
  const balance = await computeVenueBalance(venue.id);
  const settlements = await listSettlements(venue.id);
  const txns = await db.transaction.findMany({
    where: { venueId: venue.id },
    include: { user: true, reservation: { include: { event: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const revenue    = txns.filter(t => t.status === "PAID" && t.amountAgorot > 0).reduce((s, t) => s + t.amountAgorot, 0);
  const credEarned = txns.reduce((s, t) => s + Math.max(0, t.creditsDelta), 0);
  const credSpent  = txns.reduce((s, t) => s + Math.abs(Math.min(0, t.creditsDelta)), 0);
  const avgTxn     = txns.length ? Math.round(revenue / txns.length) : 0;

  const methodLabel: Record<string, string> = {
    GROW: "כרטיס אשראי / Bit", APPLE_PAY: "Apple Pay", GOOGLE_PAY: "Google Pay",
    CLUB_IT: "Club-It", CREDITS: "קרדיטים", MIXED: "משולב", DEMO: "דמו",
    STRIPE_CARD: "כרטיס אשראי",
  };
  const statusLabel: Record<string, string> = {
    PAID: "שולם", PENDING: "ממתין", FAILED: "נכשל", REFUNDED: "הוחזר",
  };

  const csvRows: CsvRow[] = txns.map((t) => ({
    date: `${formatDateHe(t.createdAt)} ${formatTimeHe(t.createdAt)}`,
    customer: t.user?.name ?? "אורח",
    event: t.reservation?.event.name ?? "—",
    method: methodLabel[t.paymentMethod] ?? t.paymentMethod,
    amount: (t.amountAgorot / 100).toFixed(2),
    credits: String(t.creditsDelta),
    status: statusLabel[t.status] ?? t.status,
  }));

  return (
    <div className="min-h-screen">
      <header className="crm-page-header">
        <div>
          <h1 className="text-xl font-semibold text-ink">עסקאות ותשלומים</h1>
          <p className="text-xs text-ink-muted mt-0.5">{txns.length} רשומות</p>
        </div>
        <ExportCsvButton rows={csvRows} />
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

        {/* Net Payout Balance (live ledger) */}
        <div className="bg-bg-card border border-gold/25 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-semibold text-ink flex items-center gap-2">
              <Banknote className="w-4 h-4 text-gold" /> יתרה לזיכוי (Net Payout)
            </h2>
            <span className="text-xs text-ink-muted">{balance.txnCount} עסקאות פתוחות · עמלת Clubbing {balance.commissionPct}%</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-line rtl:divide-x-reverse">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted mb-1">
                <TrendingUp className="w-3.5 h-3.5" /> הכנסה ברוטו
              </div>
              <div className="font-display text-2xl text-ink">{formatILS(balance.gross)}</div>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted mb-1">
                <Scissors className="w-3.5 h-3.5" /> עמלת Clubbing
              </div>
              <div className="font-display text-2xl text-danger">−{formatILS(balance.commission)}</div>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted mb-1">
                <Wallet className="w-3.5 h-3.5" /> נטו לזיכוי
              </div>
              <div className="font-display text-2xl text-gold">{formatILS(balance.net)}</div>
            </div>
          </div>
          {settlements.length > 0 && (
            <div className="border-t border-line px-6 py-3">
              <p className="text-xs text-ink-muted mb-2">היסטוריית זיכויים</p>
              <div className="space-y-1.5">
                {settlements.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">
                      {formatDateHe(s.createdAt)} · {s.txnCount} עסקאות{s.bankRef ? ` · אסמכתא ${s.bankRef}` : ""}
                    </span>
                    <span className="text-gold font-medium">{formatILS(s.netAgorot)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
    PAID:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    PENDING:  "bg-warn/15 text-warn border-warn/30",
    FAILED:   "bg-danger/15 text-danger border-danger/30",
    REFUNDED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  const labels: Record<string, string> = { PAID: "שולם", PENDING: "ממתין", FAILED: "נכשל", REFUNDED: "הוחזר" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? "bg-bg-soft text-ink-muted border-line"}`}>
      {labels[status] ?? status}
    </span>
  );
}
