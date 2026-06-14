import { requireVenueSession } from "@/lib/venue-session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { formatILS, formatCredits } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_LABEL_HE } from "@/lib/tier";
import CreditAction from "./credit-action";

export default async function CustomersPage() {
  const { venue, role } = await requireVenueSession();
  const canCredit = can(role, "credit");

  // Group reservations by user, joining with their Club-it card if any
  const reservations = await db.reservation.findMany({
    where: { venueId: venue.id, status: "PAID" },
    include: {
      user: {
        include: {
          clubItCard: {
            include: {
              balances: { where: { venueId: venue.id } },
            },
          },
        },
      },
    },
  });

  type Row = {
    id: string;
    cardId: string | null;
    name: string;
    contact: string;
    tier: string;
    cardLast4: string;
    totalSpent: number;
    txCount: number;
    creditsBalance: number;
    creditsEarned: number;
    creditsSpent: number;
  };

  const map = new Map<string, Row>();
  for (const r of reservations) {
    const key = r.user?.id ?? r.guestEmail ?? r.guestPhone ?? r.id;
    const existing = map.get(key);
    const cardBalance = r.user?.clubItCard?.balances[0];
    const row: Row = existing ?? {
      id: key,
      cardId: r.user?.clubItCard?.id ?? null,
      name: r.user?.name ?? r.guestName ?? "אורח",
      contact: r.user?.phone ?? r.user?.email ?? r.guestPhone ?? r.guestEmail ?? "—",
      tier: r.user?.clubItCard?.tier ?? "STANDARD",
      cardLast4: r.user?.clubItCard?.cardNumberLast4 ?? "—",
      totalSpent: 0,
      txCount: 0,
      creditsBalance: cardBalance?.creditsBalance ?? 0,
      creditsEarned: cardBalance?.creditsAccrued ?? 0,
      creditsSpent: cardBalance?.creditsRedeemed ?? 0,
    };
    row.totalSpent += r.totalAgorot;
    row.txCount += 1;
    map.set(key, row);
  }

  const customers = Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);

  const tierCount = {
    STANDARD: customers.filter((c) => c.tier === "STANDARD" || c.tier === "REGULAR").length,
    SILVER: customers.filter((c) => c.tier === "SILVER").length,
    GOLD: customers.filter((c) => c.tier === "GOLD").length,
    PLATINUM: customers.filter((c) => c.tier === "PLATINUM").length,
  };

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">לקוחות ודרגות</h1>
        <p className="text-sm text-ink-muted">{customers.length} לקוחות במועדון</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <TierCard tier="STANDARD" count={tierCount.STANDARD} desc="לקוח חדש" />
        <TierCard tier="SILVER" count={tierCount.SILVER} desc="≥ ₪500" />
        <TierCard tier="GOLD" count={tierCount.GOLD} desc="≥ ₪2,000" />
        <TierCard tier="PLATINUM" count={tierCount.PLATINUM} desc="≥ ₪5,000" />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft border-b border-line">
            <tr className="text-right text-xs text-ink-muted uppercase tracking-wider">
              <th className="px-5 py-3">לקוח</th>
              <th className="px-5 py-3">Club-it</th>
              <th className="px-5 py-3">הוצאה כוללת</th>
              <th className="px-5 py-3">עסקאות</th>
              <th className="px-5 py-3">קרדיטים</th>
              <th className="px-5 py-3">נצברו · מומשו</th>
              <th className="px-5 py-3 text-left">דרגה</th>
              {canCredit && <th className="px-5 py-3 text-left">פעולות</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-bg-soft">
                <td className="px-5 py-3">
                  <div className="text-ink">{c.name}</div>
                  <div className="text-xs text-ink-muted">{c.contact}</div>
                </td>
                <td className="px-5 py-3 text-ink-muted font-mono">
                  {c.cardLast4 === "—" ? "לא נרשם" : `•••• ${c.cardLast4}`}
                </td>
                <td className="px-5 py-3 text-ink">{formatILS(c.totalSpent)}</td>
                <td className="px-5 py-3 text-ink">{c.txCount}</td>
                <td className="px-5 py-3 text-gold">{formatCredits(c.creditsBalance)}</td>
                <td className="px-5 py-3 text-xs">
                  <span className="text-emerald-400">+{c.creditsEarned}</span> ·{" "}
                  <span className="text-danger">−{c.creditsSpent}</span>
                </td>
                <td className="px-5 py-3 text-left">
                  <TierTag tier={c.tier} />
                </td>
                {canCredit && (
                  <td className="px-5 py-3 text-left">
                    {c.cardId ? (
                      <CreditAction cardId={c.cardId} name={c.name} balance={c.creditsBalance} />
                    ) : (
                      <span className="text-xs text-ink-dim">אין כרטיס</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function TierCard({ tier, count, desc }: { tier: string; count: number; desc: string }) {
  const colors: Record<string, string> = {
    STANDARD: "text-ink-muted border-ink-muted/30",
    SILVER: "text-tier-silver border-tier-silver/40",
    GOLD: "text-gold border-gold/40",
    PLATINUM: "text-tier-platinum border-tier-platinum/40",
  };
  return (
    <div className={`kpi-card border-l-2 ${colors[tier]}`}>
      <div className={`text-xs uppercase tracking-wider ${colors[tier].split(" ")[0]}`}>
        {tier}
      </div>
      <div className="font-display text-3xl text-ink">{count}</div>
      <div className="text-xs text-ink-dim">{desc}</div>
    </div>
  );
}

function TierTag({ tier }: { tier: string }) {
  const variants: Record<string, "default" | "gold" | "info" | "purple"> = {
    STANDARD: "default",
    REGULAR: "default",
    SILVER: "default",
    GOLD: "gold",
    PLATINUM: "info",
  };
  return <Badge variant={variants[tier] ?? "default"}>{tier}</Badge>;
}
