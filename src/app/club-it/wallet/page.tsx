import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCredits, formatILS } from "@/lib/utils";
import { progressToNextTier, TIER_LABEL_HE } from "@/lib/tier";
import { asTier } from "@/lib/enums";
import { Progress } from "@/components/ui/progress";
import { RedeemDialog } from "./redeem-dialog";

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/auth");

  const card = await db.clubItCard.findUnique({
    where: { userId },
    include: {
      balances: { include: { venue: true } },
    },
  });
  if (!card) redirect("/club-it/join");

  const totalBalance = card.balances.reduce((s, b) => s + b.creditsBalance, 0);
  const progress = progressToNextTier(card.totalSpentAgorot);

  return (
    <div className="mobile-screen pb-10">
      <div className="px-5 pt-10 pb-4">
        <h1 className="font-display text-2xl text-gold mb-1">הארנק שלי</h1>
        <p className="text-sm text-ink-muted">קרדיטים מצטברים לפי מועדון</p>
      </div>

      {/* Total balance hero */}
      <div className="mx-5 mb-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-bg-card p-6 text-center">
        <div className="text-xs text-ink-muted mb-1">סה״כ קרדיטים</div>
        <div className="font-display text-5xl text-gold-gradient mb-1">
          {formatCredits(totalBalance)}
        </div>
        <div className="text-xs text-ink-muted">≈ {formatILS(totalBalance * 100)}</div>
      </div>

      {/* Tier */}
      <div className="px-5 mb-6">
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-muted">דרגה נוכחית</span>
            <span className="font-display text-gold">
              {TIER_LABEL_HE[asTier(card.tier)]} → {progress.next ? TIER_LABEL_HE[progress.next] : "מקסימום"}
            </span>
          </div>
          {progress.next && (
            <>
              <Progress value={progress.percent} variant="gold" />
              <div className="text-xs text-ink-muted mt-2 text-center">
                עוד {formatILS(progress.remainingAgorot)} לדרגת {TIER_LABEL_HE[progress.next]}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-venue balances */}
      <div className="px-5">
        <h3 className="text-sm text-ink-muted mb-3">פירוט לפי מועדון</h3>
        {card.balances.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-8">
            עדיין אין קרדיטים. שלם/י עם Club-it כדי לצבור.
          </p>
        ) : (
          <div className="space-y-2">
            {card.balances.map((b) => (
              <div
                key={b.id}
                className="card-elevated p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-ink">{b.venue.name}</div>
                  <div className="text-xs text-ink-muted">{b.venue.city}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-gold text-xl">
                    {formatCredits(b.creditsBalance)}
                  </div>
                  <RedeemDialog
                    venueId={b.venueId}
                    venueName={b.venue.name}
                    available={b.creditsBalance}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 px-5">
        <Link href="/club-it/history" className="btn-ghost w-full">
          היסטוריית פעולות ←
        </Link>
      </div>
    </div>
  );
}
