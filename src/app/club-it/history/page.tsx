import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCredits, timeAgoHe } from "@/lib/utils";
import { TIER_LABEL_HE } from "@/lib/tier";
import { asTier } from "@/lib/enums";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/auth");

  const card = await db.clubItCard.findUnique({
    where: { userId },
    include: {
      ledger: { orderBy: { createdAt: "desc" }, take: 50 },
      tierEvents: { orderBy: { createdAt: "desc" } },
      balances: true,
    },
  });
  if (!card) redirect("/club-it/join");

  const totalBalance = card.balances.reduce((s, b) => s + b.creditsBalance, 0);

  const items: Array<{
    id: string;
    kind: string;
    amount?: number;
    label: string;
    date: Date;
    note?: string;
  }> = [];

  card.ledger.forEach((l) =>
    items.push({
      id: l.id,
      kind: l.kind,
      amount: l.amount,
      label: l.kind === "EARN_PURCHASE"
        ? "רכישה"
        : l.kind === "EARN_BUMP"
        ? "Bump · אני כאן"
        : l.kind === "REDEEM_BAR"
        ? "מימוש בבר"
        : l.kind === "REDEEM_FOOD"
        ? "מימוש מטבח"
        : "פעולה",
      date: l.createdAt,
      note: l.note ?? undefined,
    })
  );

  card.tierEvents.forEach((e) =>
    items.push({
      id: e.id,
      kind: "TIER_UP",
      label: `🎉 עליית דרגה — ${TIER_LABEL_HE[asTier(e.toTier)]}`,
      date: e.createdAt,
    })
  );

  items.push({
    id: "join",
    kind: "JOIN",
    label: "✨ הצטרפת ל-Club-it",
    date: card.issuedAt,
  });

  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mobile-screen pb-10">
      <div className="sticky top-0 z-10 glass border-b border-line px-5 py-3 flex items-center justify-between">
        <span className="font-display text-gold">{TIER_LABEL_HE[asTier(card.tier)]}</span>
        <span className="text-sm">
          <span className="text-ink-muted">יתרה:</span>{" "}
          <span className="text-gold font-display">{formatCredits(totalBalance)}</span>
        </span>
      </div>

      <div className="px-5 pt-6 space-y-2">
        {items.map((it) => (
          <div key={it.id} className="card-elevated p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="font-semibold text-ink text-sm">{it.label}</div>
              <div className="text-xs text-ink-muted">{timeAgoHe(it.date)}</div>
              {it.note && <div className="text-xs text-ink-dim mt-1">{it.note}</div>}
            </div>
            {it.amount !== undefined && it.amount !== 0 && (
              <div
                className={
                  it.amount > 0
                    ? "text-success font-display"
                    : "text-danger font-display"
                }
              >
                {it.amount > 0 ? "+" : ""}{formatCredits(it.amount)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
