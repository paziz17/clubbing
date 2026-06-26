"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatILS } from "@/lib/utils";

export function SettleButton({
  venueId,
  venueName,
  net,
}: {
  venueId: string;
  venueName: string;
  net: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bankRef, setBankRef] = useState("");
  const [loading, setLoading] = useState(false);

  async function settle() {
    setLoading(true);
    const res = await fetch("/api/venue/admin/settle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venueId, bankRef: bankRef || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setBankRef("");
      router.refresh();
    } else {
      alert("הזיכוי נכשל");
    }
  }

  if (net <= 0) return <span className="text-xs text-ink-dim">—</span>;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold rounded-lg border border-gold/40 text-gold px-3 py-1.5 hover:bg-gold/10 transition-colors"
      >
        סמן כשולם
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" dir="rtl">
          <div className="w-full max-w-sm bg-bg-card border border-gold/20 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-ink mb-1">זיכוי תשלום</h3>
            <p className="text-sm text-ink-muted mb-4">
              {venueName} · נטו <span className="text-gold font-semibold">{formatILS(net)}</span>
            </p>
            <label className="block text-xs text-ink-muted mb-1">אסמכתת העברה בנקאית (אופציונלי)</label>
            <input
              value={bankRef}
              onChange={(e) => setBankRef(e.target.value)}
              className="input w-full mb-4"
              placeholder="מס׳ אסמכתא"
            />
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 h-10 rounded-lg border border-line text-sm text-ink-muted">
                ביטול
              </button>
              <button onClick={settle} disabled={loading} className="flex-1 btn-gold h-10 text-sm font-semibold">
                {loading ? "..." : "אשר זיכוי"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
