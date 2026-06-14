"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, X, Coins } from "lucide-react";

export default function CreditAction({
  cardId,
  name,
  balance,
}: {
  cardId: string;
  name: string;
  balance: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sign, setSign] = useState<1 | -1>(1);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseInt(amount, 10);
    if (!Number.isInteger(value) || value <= 0) {
      setError("הזן מספר קרדיטים חיובי");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/venue/customers/credit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cardId, amount: sign * value, note: note.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && data.ok) {
      setOpen(false);
      setAmount("");
      setNote("");
      router.refresh();
    } else {
      setError(data.error ?? "עדכון נכשל");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-gold/30 px-2.5 py-1 text-xs text-gold hover:bg-gold/10 transition-colors"
        title="עדכון קרדיטים"
      >
        <Coins className="w-3.5 h-3.5" /> קרדיטים
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" dir="rtl">
          <div className="w-full max-w-sm bg-bg-card border border-gold/20 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-ink">עדכון קרדיטים</h2>
              <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-ink-muted mb-1">
              לקוח: <span className="text-ink font-medium">{name}</span>
            </p>
            <p className="text-xs text-ink-dim mb-4">יתרה נוכחית: {balance} קרדיטים</p>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSign(1)}
                  className={`h-10 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    sign === 1 ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400" : "border-line text-ink-muted"
                  }`}
                >
                  <Plus className="w-4 h-4" /> זיכוי
                </button>
                <button
                  type="button"
                  onClick={() => setSign(-1)}
                  className={`h-10 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    sign === -1 ? "border-danger/50 bg-danger/10 text-danger" : "border-line text-ink-muted"
                  }`}
                >
                  <Minus className="w-4 h-4" /> חיוב
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">כמות קרדיטים</label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input w-full"
                  placeholder="50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">הערה (אופציונלי)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input w-full"
                  placeholder="פיצוי / מתנה / תיקון..."
                  maxLength={200}
                />
              </div>
              {error && (
                <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 h-10 rounded-lg border border-line text-sm text-ink-muted hover:text-ink transition-colors">
                  ביטול
                </button>
                <button disabled={loading} className="flex-1 btn-gold h-10 text-sm font-semibold">
                  {loading ? "מעדכן..." : "עדכן"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
