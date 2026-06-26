"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreditCard, Wallet } from "lucide-react";

export function BarPayButtons({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState<null | "CARD" | "WALLET">(null);
  const [error, setError] = useState<string | null>(null);
  const loggedIn = Boolean(session?.user && !(session.user as any).isGuest);

  async function pay(method: "CARD" | "WALLET") {
    setLoading(method);
    setError(null);
    try {
      const res = await fetch("/api/bar/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "התשלום נכשל");
        setLoading(null);
        return;
      }
      if (data.status === "checkout" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      router.push(`/bar/paid/${orderId}`);
    } catch {
      setError("התשלום נכשל, נסה/י שוב");
      setLoading(null);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <button
        onClick={() => pay("CARD")}
        disabled={loading !== null}
        className="w-full p-4 rounded-xl border border-gold bg-gold/10 hover:bg-gold/15 text-right transition-all flex items-center gap-3"
      >
        <CreditCard className="w-5 h-5 text-gold" />
        <div className="flex-1">
          <div className="font-semibold text-ink">כרטיס אשראי / Apple Pay / Google Pay</div>
          <div className="text-xs text-ink-muted">תשלום מאובטח</div>
        </div>
        {loading === "CARD" && <span className="text-xs text-gold">...</span>}
      </button>

      <button
        onClick={() => pay("WALLET")}
        disabled={loading !== null || !loggedIn}
        className="w-full p-4 rounded-xl border border-line bg-bg-card hover:border-gold/40 disabled:opacity-50 text-right transition-all flex items-center gap-3"
      >
        <Wallet className="w-5 h-5 text-ink-muted" />
        <div className="flex-1">
          <div className="font-semibold text-ink">ארנק Club-it</div>
          <div className="text-xs text-ink-muted">
            {loggedIn ? "שימוש ביתרת קרדיטים" : "התחבר/י כדי לשלם מהארנק"}
          </div>
        </div>
        {loading === "WALLET" && <span className="text-xs text-gold">...</span>}
      </button>

      {error && <p className="text-center text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
