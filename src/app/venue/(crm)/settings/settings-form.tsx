"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle } from "lucide-react";

interface Props {
  settings: any;
  tierCounts: Record<string, number>;
}

export function SettingsForm({ settings, tierCounts }: Props) {
  const router = useRouter();
  let rates: Record<string, number> = {};
  try {
    rates = typeof settings.creditRatePerTier === "string"
      ? JSON.parse(settings.creditRatePerTier)
      : settings.creditRatePerTier ?? {};
  } catch {
    rates = {};
  }
  const [form, setForm] = useState({
    regular: String(rates?.REGULAR ?? 0.02),
    silver: String(rates?.SILVER ?? 0.03),
    gold: String(rates?.GOLD ?? 0.04),
    platinum: String(rates?.PLATINUM ?? 0.05),
    expiry: String(settings.creditExpiryDays ?? 365),
    minRedemption: String((settings.minRedemptionAgorot ?? 5000) / 100),
    silverT: String((settings.silverThresholdAgorot ?? 50000) / 100),
    goldT: String((settings.goldThresholdAgorot ?? 200000) / 100),
    platinumT: String((settings.platinumThresholdAgorot ?? 500000) / 100),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/venue/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        creditRatePerTier: JSON.stringify({
          REGULAR: Number(form.regular),
          SILVER: Number(form.silver),
          GOLD: Number(form.gold),
          PLATINUM: Number(form.platinum),
        }),
        creditExpiryDays: Number(form.expiry),
        minRedemptionAgorot: Math.round(Number(form.minRedemption) * 100),
        silverThresholdAgorot: Math.round(Number(form.silverT) * 100),
        goldThresholdAgorot: Math.round(Number(form.goldT) * 100),
        platinumThresholdAgorot: Math.round(Number(form.platinumT) * 100),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  }

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-ink">תוכנית הקרדיטים</h2>

        <div className="grid grid-cols-4 gap-3">
          <Field label="REGULAR" value={form.regular} onChange={(v) => set("regular", v)} suffix="× סכום" hint="2%" />
          <Field label="SILVER" value={form.silver} onChange={(v) => set("silver", v)} suffix="× סכום" hint="3%" />
          <Field label="GOLD" value={form.gold} onChange={(v) => set("gold", v)} suffix="× סכום" hint="4%" />
          <Field label="PLATINUM" value={form.platinum} onChange={(v) => set("platinum", v)} suffix="× סכום" hint="5%" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="תוקף קרדיטים (ימים)" value={form.expiry} onChange={(v) => set("expiry", v)} />
          <Field label="מימוש מינימום (₪)" value={form.minRedemption} onChange={(v) => set("minRedemption", v)} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-ink">סף לרמות (₪ הוצאה כוללת)</h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Silver" value={form.silverT} onChange={(v) => set("silverT", v)} suffix="₪" />
          <Field label="Gold" value={form.goldT} onChange={(v) => set("goldT", v)} suffix="₪" />
          <Field label="Platinum" value={form.platinumT} onChange={(v) => set("platinumT", v)} suffix="₪" />
        </div>

        {/* visual ladder */}
        <div className="mt-4">
          <div className="flex h-6 rounded overflow-hidden border border-line text-xs text-black font-semibold">
            <div className="flex-1 bg-ink-muted/40 flex items-center justify-center">
              REGULAR · {tierCounts.REGULAR ?? 0}
            </div>
            <div className="flex-1 bg-tier-silver/80 flex items-center justify-center">
              SILVER · {tierCounts.SILVER ?? 0}
            </div>
            <div className="flex-1 bg-gold flex items-center justify-center">
              GOLD · {tierCounts.GOLD ?? 0}
            </div>
            <div className="flex-1 bg-tier-platinum flex items-center justify-center">
              PLATINUM · {tierCounts.PLATINUM ?? 0}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={saving}>
          {saving ? "..." : "שמור שינויים"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-success text-sm">
            <Check className="w-4 h-4" />
            נשמר בהצלחה
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-warn">
          <AlertTriangle className="w-3.5 h-3.5" />
          השינויים יחולו על כל הלקוחות הקיימים ויחולו רטרואקטיבית
        </span>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-ink-muted mb-1.5">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type="number" step="0.01" />
      {(suffix || hint) && (
        <div className="text-[10px] text-ink-dim mt-1">{suffix ?? ""} {hint ? `· ${hint}` : ""}</div>
      )}
    </div>
  );
}
