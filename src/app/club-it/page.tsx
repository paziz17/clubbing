import Link from "next/link";
import { ClubItCard } from "@/components/club-it-card";
import { Check, Sparkles, Zap, Award } from "lucide-react";

// Club-it tier explanation page
export default function ClubItIntroPage() {
  return (
    <div className="mobile-screen pb-10">
      <div className="px-5 pt-10 pb-6 text-center">
        <h1 className="font-display text-3xl text-gold-gradient mb-2">CLUB-IT</h1>
        <p className="text-sm text-ink-muted">חברות פרימיום · קרדיטים · דרגות</p>
      </div>

      <div className="flex justify-center mb-8">
        <ClubItCard size="md" preview />
      </div>

      <div className="px-5 space-y-6">
        {/* 3 steps */}
        <div className="space-y-3">
          <Step
            n={1}
            icon={<Sparkles className="w-5 h-5 text-gold" />}
            title="שלם/י עם Club-it"
            desc="בבר, במועדון, אצל שותפים"
          />
          <Step
            n={2}
            icon={<Zap className="w-5 h-5 text-gold" />}
            title="צבירת קרדיטים אוטומטית"
            desc="2%–5% חזרה לפי הדרגה"
          />
          <Step
            n={3}
            icon={<Award className="w-5 h-5 text-gold" />}
            title="מימוש בבר או בלילה הבא"
            desc="קוד וצ'ר · 8 ספרות · 24 שעות תוקף"
          />
        </div>

        {/* Tiers ladder */}
        <div>
          <h3 className="text-sm text-ink-muted mb-3">סולם הדרגות</h3>
          <div className="space-y-2">
            <Tier color="text-tier-regular" name="REGULAR" hint="התחלה" rate="2%" />
            <Tier color="text-tier-silver" name="SILVER" hint="מהוצאה כוללת ₪500" rate="3%" />
            <Tier color="text-tier-gold" name="GOLD" hint="מ-₪2,000" rate="4% + הנחות שותף" />
            <Tier color="text-tier-platinum" name="PLATINUM" hint="מ-₪5,000" rate="5% + Lounge + VIP" />
          </div>
        </div>

        <Link href="/club-it/join" className="btn-gold w-full h-12 mt-4">
          הנפק/י את הכרטיס שלי ←
        </Link>
      </div>
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 card-elevated p-4">
      <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-display text-sm">
        {n}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-ink mb-0.5">{title}</div>
        <div className="text-xs text-ink-muted">{desc}</div>
      </div>
      <div>{icon}</div>
    </div>
  );
}

function Tier({ color, name, hint, rate }: { color: string; name: string; hint: string; rate: string }) {
  return (
    <div className="flex items-center justify-between card-elevated p-3">
      <div className="flex items-center gap-3">
        <span className={`font-display text-lg ${color}`}>{name}</span>
        <span className="text-xs text-ink-muted">{hint}</span>
      </div>
      <span className="chip-gold">{rate}</span>
    </div>
  );
}
