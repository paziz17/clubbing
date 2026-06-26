import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { computeVenueBalance } from "@/lib/payouts";
import { formatILS } from "@/lib/utils";
import { Banknote, ChevronRight } from "lucide-react";
import { SettleButton } from "./settle-button";

export default async function AdminPayoutsPage() {
  if (!(await getAdminSession())) redirect("/venue/admin");

  const venues = await db.venue.findMany({ orderBy: { name: "asc" } });
  const rows = await Promise.all(
    venues.map(async (v) => ({ venue: v, balance: await computeVenueBalance(v.id) }))
  );
  rows.sort((a, b) => b.balance.net - a.balance.net);

  const totalNet = rows.reduce((s, r) => s + r.balance.net, 0);
  const totalGross = rows.reduce((s, r) => s + r.balance.gross, 0);
  const totalCommission = rows.reduce((s, r) => s + r.balance.commission, 0);

  return (
    <div dir="rtl" className="min-h-screen crm-container" style={{ background: "#06060A" }}>
      <div className="crm-page-header flex items-center justify-between">
        <div>
          <a href="/venue/admin/dashboard" className="text-xs text-ink-muted hover:text-gold flex items-center gap-1 mb-1">
            <ChevronRight className="w-3 h-3" /> חזרה לדשבורד
          </a>
          <h1 className="text-2xl font-display text-gold-gradient flex items-center gap-2">
            <Banknote className="w-6 h-6" /> תשלומים למועדונים
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            סה״כ נטו לזיכוי: <span className="text-gold font-semibold">{formatILS(totalNet)}</span> · ברוטו {formatILS(totalGross)} · עמלות {formatILS(totalCommission)}
          </p>
        </div>
      </div>

      <div className="crm-page-body">
        <div className="bg-bg-card border border-line rounded-xl overflow-hidden">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>מועדון</th>
                <th>עסקאות פתוחות</th>
                <th>ברוטו</th>
                <th>עמלה</th>
                <th>נטו לזיכוי</th>
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ venue, balance }) => (
                <tr key={venue.id}>
                  <td className="font-medium text-ink">{venue.name}</td>
                  <td>{balance.txnCount}</td>
                  <td className="text-ink">{formatILS(balance.gross)}</td>
                  <td className="text-danger">−{formatILS(balance.commission)} ({balance.commissionPct}%)</td>
                  <td className="text-gold font-semibold">{formatILS(balance.net)}</td>
                  <td>
                    <SettleButton venueId={venue.id} venueName={venue.name} net={balance.net} />
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
