"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Plus, Minus, X, CheckCircle2, Loader2 } from "lucide-react";
import { formatILS } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  priceAgorot: number;
  section?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  DRINK: "משקאות",
  STARTER: "מנות פתיחה",
  MAIN: "עיקריות",
  PIZZA: "פיצות",
  DESSERT: "קינוחים",
};

// Bar on top, restaurant below — both feed the same cart / QR-pay flow.
const SECTIONS: { key: string; label: string }[] = [
  { key: "BAR", label: "בר" },
  { key: "RESTAURANT", label: "מסעדה" },
];

type Phase = "build" | "awaiting" | "paid";

export function BarPOS({ menu }: { menu: MenuItem[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<Phase>("build");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qr, setQr] = useState<string>("");
  const [payUrl, setPayUrl] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const items = menu.map((m) => ({ ...m, qty: cart[m.id] ?? 0 }));
  const subtotal = items.reduce((s, m) => s + m.priceAgorot * m.qty, 0);
  const count = items.reduce((s, m) => s + m.qty, 0);

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }
  function sub(id: string) {
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) - 1);
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  async function createOrder() {
    setCreating(true);
    try {
      const res = await fetch("/api/venue/bar/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "יצירת ההזמנה נכשלה");
        return;
      }
      const url = `${window.location.origin}/bar/pay/${data.orderId}`;
      setOrderId(data.orderId);
      setPayUrl(url);
      setQr(await QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#0b0b12", light: "#ffffff" } }));
      setPhase("awaiting");
    } finally {
      setCreating(false);
    }
  }

  // Poll for payment confirmation while awaiting (near real-time).
  // Self-scheduling loop (~1s) so a slow response never stacks requests.
  useEffect(() => {
    if (phase !== "awaiting" || !orderId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/venue/bar/orders/${orderId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.status === "PAID") {
            setPhase("paid");
            return;
          }
          if (data.status === "CANCELLED" || data.status === "EXPIRED") {
            reset();
            return;
          }
        }
      } catch {
        /* transient network hiccup — keep polling */
      }
      if (!cancelled) timer = setTimeout(tick, 1000);
    };
    timer = setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, orderId]);

  function reset() {
    setCart({});
    setOrderId(null);
    setQr("");
    setPayUrl("");
    setPhase("build");
  }

  async function cancelOrder() {
    if (orderId) {
      await fetch(`/api/venue/bar/orders/${orderId}`, { method: "DELETE" }).catch(() => {});
    }
    reset();
  }

  if (phase === "paid") {
    return (
      <div className="card-elevated p-10 text-center max-w-md mx-auto">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-emerald-400 mb-2">העסקה עברה בהצלחה!</h2>
        <p className="text-ink-muted mb-6">אפשר למסור את ההזמנה לבליין</p>
        <Button variant="gold" onClick={reset}>הזמנה חדשה</Button>
      </div>
    );
  }

  if (phase === "awaiting") {
    return (
      <div className="card-elevated p-8 text-center max-w-md mx-auto">
        <div className="inline-flex items-center gap-2 text-gold mb-4">
          <Loader2 className="w-4 h-4 animate-spin" /> ממתין לתשלום…
        </div>
        <p className="text-sm text-ink-muted mb-4">הבליין סורק את הקוד ומשלם מהטלפון</p>
        {qr && (
          <div className="relative mx-auto w-[260px] h-[260px]">
            {/* Pulsing ring — visual heartbeat while we poll for confirmation */}
            <span className="absolute inset-0 rounded-xl border-2 border-gold/60 animate-ping" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-gold/30" />
            <img
              src={qr}
              alt="QR לתשלום"
              width={260}
              height={260}
              className="relative rounded-xl border border-line bg-white p-3"
            />
          </div>
        )}
        <div className="font-display text-3xl text-gold mt-4">{formatILS(subtotal)}</div>
        <a href={payUrl} target="_blank" className="text-xs text-ink-muted underline block mt-2">
          {payUrl}
        </a>
        <Button variant="danger" onClick={cancelOrder} className="mt-6">
          <X className="w-4 h-4" /> ביטול
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-8">
        {SECTIONS.map((sec) => {
          const secItems = menu.filter((m) => (m.section ?? "RESTAURANT") === sec.key);
          if (secItems.length === 0) return null;
          const cats = Array.from(new Set(secItems.map((m) => m.category)));
          return (
            <div key={sec.key} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl text-gold whitespace-nowrap">{sec.label}</h2>
                <span className="h-px flex-1 bg-line" />
              </div>
              {cats.map((cat) => (
                <div key={cat}>
                  <div className="text-xs text-ink-dim uppercase tracking-widest mb-2">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {secItems
                      .filter((m) => m.category === cat)
                      .map((m) => {
                        const qty = cart[m.id] ?? 0;
                        return (
                          <button
                            key={m.id}
                            onClick={() => add(m.id)}
                            className={`rounded-xl border p-3 text-right transition-all ${
                              qty > 0 ? "border-gold bg-gold/10" : "border-line bg-bg-card hover:border-gold/40"
                            }`}
                          >
                            <div className="font-semibold text-ink text-sm">{m.name}</div>
                            <div className="text-gold text-sm">{formatILS(m.priceAgorot)}</div>
                            {qty > 0 && <div className="text-xs text-gold mt-1">× {qty}</div>}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        {menu.length === 0 && (
          <p className="text-ink-muted">אין פריטים בתפריט — הוסף/י דרך "מטבח וזמנות".</p>
        )}
      </div>

      <div className="card-elevated p-4 h-fit sticky top-4">
        <h3 className="font-semibold text-ink mb-3">עגלה</h3>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {items.filter((m) => m.qty > 0).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button onClick={() => sub(m.id)} className="w-7 h-7 rounded-full border border-line flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-gold">{m.qty}</span>
                <button onClick={() => add(m.id)} className="w-7 h-7 rounded-full border border-line flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 text-sm text-ink truncate text-right">{m.name}</div>
              <div className="text-sm text-ink-muted">{formatILS(m.priceAgorot * m.qty)}</div>
            </div>
          ))}
          {count === 0 && <p className="text-sm text-ink-muted text-center py-6">העגלה ריקה</p>}
        </div>
        <div className="border-t border-line mt-3 pt-3 flex items-center justify-between">
          <span className="text-ink-muted text-sm">סה״כ</span>
          <span className="font-display text-2xl text-gold">{formatILS(subtotal)}</span>
        </div>
        <Button variant="gold" className="w-full mt-3" disabled={count === 0 || creating} onClick={createOrder}>
          {creating ? "..." : "לתשלום · צור QR"}
        </Button>
      </div>
    </div>
  );
}
