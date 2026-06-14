"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export function RefundButton({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function refund() {
    const ok = window.confirm(
      "לבצע החזר כספי מלא להזמנה זו?\nהלקוח יזוכה דרך Stripe וקרדיטים שנצברו על הרכישה יבוטלו. לא ניתן לבטל פעולה זו."
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/venue/reservations/${reservationId}/refund`,
        { method: "POST" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(json.error ?? "ההחזר נכשל");
        return;
      }
      router.refresh();
    } catch {
      window.alert("ההחזר נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={refund}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs text-ink-muted hover:text-danger hover:border-danger/40 transition-colors disabled:opacity-50"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      {loading ? "מבצע…" : "החזר"}
    </button>
  );
}
