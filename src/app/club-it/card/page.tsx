import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClubItCard } from "@/components/club-it-card";
import { TIER_LABEL_HE } from "@/lib/tier";
import { asTier } from "@/lib/enums";
import { Wallet, History, Plus } from "lucide-react";

export default async function ClubItCardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/auth");

  const card = await db.clubItCard.findUnique({ where: { userId } });
  if (!card) redirect("/club-it/join");

  return (
    <div className="mobile-screen pb-10">
      {welcome && (
        <div className="bg-success/10 border-b border-success/30 px-5 py-3 text-sm text-center text-success">
          ✓ הכרטיס הופק בהצלחה
        </div>
      )}

      <div className="px-5 pt-10 pb-6 text-center">
        <h1 className="font-display text-2xl text-gold mb-2">
          {welcome ? "ברוך/ה הבא/ה" : "הכרטיס שלי"}
        </h1>
        <p className="text-sm text-ink-muted">
          שלם/י עם Club-it וקבל/י קרדיטים על כל בילוי
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <ClubItCard
          name={card.displayName}
          last4={card.cardNumberLast4}
          tier={asTier(card.tier)}
          size="lg"
        />
      </div>

      <div className="px-5 space-y-3">
        <button
          disabled
          className="w-full p-4 rounded-xl border border-line bg-bg-card text-right opacity-60 cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-ink-muted" />
            <div className="flex-1">
              <div className="font-semibold text-ink">הוסף/י ל-Wallet</div>
              <div className="text-xs text-ink-muted">Apple Pay · בקרוב</div>
            </div>
          </div>
        </button>

        <Link
          href="/club-it/wallet"
          className="block w-full p-4 rounded-xl border border-line bg-bg-card hover:border-gold/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-gold" />
            <div className="flex-1">
              <div className="font-semibold text-ink">כמה קרדיטים יש לי</div>
              <div className="text-xs text-ink-muted">ארנק קרדיטים לפי מועדון</div>
            </div>
            <span className="text-gold">←</span>
          </div>
        </Link>

        <Link
          href="/club-it/history"
          className="block w-full p-4 rounded-xl border border-line bg-bg-card hover:border-gold/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-gold" />
            <div className="flex-1">
              <div className="font-semibold text-ink">היסטוריית פעולות</div>
              <div className="text-xs text-ink-muted">
                דרגה נוכחית: {TIER_LABEL_HE[asTier(card.tier)]}
              </div>
            </div>
            <span className="text-gold">←</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
