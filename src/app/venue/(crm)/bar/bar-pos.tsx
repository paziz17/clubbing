"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Plus, Minus, X, CheckCircle2, Loader2, ShoppingCart, Maximize2, Trash2 } from "lucide-react";
import { formatILS } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  priceAgorot: number;
  section?: string;
}

interface OpenOrder {
  id: string;
  qr: string; // data URL
  payUrl: string;
  subtotalAgorot: number;
  count: number;
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

export function BarPOS({ menu }: { menu: MenuItem[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  // Multiple tabs can be open at once — each scans/pays independently.
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [zoomId, setZoomId] = useState<string | null>(null);
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
    if (count === 0 || creating) return;
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
      const qr = await QRCode.toDataURL(url, {
        width: 480,
        margin: 1,
        color: { dark: "#0b0b12", light: "#ffffff" },
      });
      setOpenOrders((o) => [
        { id: data.orderId, qr, payUrl: url, subtotalAgorot: data.subtotalAgorot, count },
        ...o,
      ]);
      // Reset cart immediately so the next customer can be served without waiting.
      setCart({});
      setZoomId(data.orderId);
    } finally {
      setCreating(false);
    }
  }

  const removeOrder = useCallback((id: string) => {
    setOpenOrders((o) => o.filter((x) => x.id !== id));
    setZoomId((z) => (z === id ? null : z));
  }, []);

  const zoomOrder = openOrders.find((o) => o.id === zoomId) ?? null;

  return (
    <div className="space-y-6">
      {/* ── Open tabs (parallel) ── */}
      {openOrders.length > 0 && (
        <div className="card-elevated p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-dim uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            הזמנות פתוחות · ממתינות לתשלום ({openOrders.length})
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {openOrders.map((o) => (
              <OpenOrderCard
                key={o.id}
                order={o}
                onResolved={removeOrder}
                onZoom={() => setZoomId(o.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu */}
        <div className="lg:col-span-2 space-y-10">
          {SECTIONS.map((sec) => {
            const secItems = menu.filter((m) => (m.section ?? "RESTAURANT") === sec.key);
            if (secItems.length === 0) return null;
            const cats = Array.from(new Set(secItems.map((m) => m.category)));
            return (
              <section key={sec.key} className="space-y-5">
                <div className="flex items-center gap-4">
                  <h2 className="font-display text-2xl text-gold-gradient whitespace-nowrap">{sec.label}</h2>
                  <span className="h-px flex-1 bg-gradient-to-l from-gold/40 to-transparent" />
                  <span className="chip-gold">{secItems.length}</span>
                </div>
                {cats.map((cat) => (
                  <div key={cat} className="space-y-2.5">
                    <div className="text-[11px] font-semibold text-ink-dim uppercase tracking-[0.2em]">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {secItems
                        .filter((m) => m.category === cat)
                        .map((m) => {
                          const qty = cart[m.id] ?? 0;
                          return (
                            <button
                              key={m.id}
                              onClick={() => add(m.id)}
                              className={`group relative overflow-hidden rounded-2xl border p-3.5 text-right transition-all duration-200 active:scale-[0.97] ${
                                qty > 0
                                  ? "border-gold bg-gold/10 shadow-gold"
                                  : "border-line bg-bg-card hover:border-gold/50 hover:bg-bg-elevated hover:-translate-y-0.5"
                              }`}
                            >
                              {qty > 0 && (
                                <span className="absolute top-2 left-2 min-w-[22px] h-[22px] px-1 rounded-full bg-gold text-black text-xs font-bold flex items-center justify-center shadow-gold">
                                  {qty}
                                </span>
                              )}
                              <div className="font-semibold text-ink text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
                                {m.name}
                              </div>
                              <div className="mt-2 font-display text-lg text-gold tabular-nums">
                                {formatILS(m.priceAgorot)}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
          {menu.length === 0 && <p className="text-ink-muted">אין פריטים פעילים בתפריט.</p>}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="card-elevated relative overflow-hidden h-fit sticky top-4">
            <span className="absolute inset-x-0 top-0 h-[2px] bg-gold-gradient" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-ink flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-gold" /> הזמנה חדשה
                </h3>
                {count > 0 && <span className="chip-gold">{count} פריטים</span>}
              </div>
              <div className="space-y-1 max-h-[46vh] overflow-y-auto no-scrollbar -mx-1 px-1">
                {items
                  .filter((m) => m.qty > 0)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 py-2 border-b border-line/40 last:border-0"
                    >
                      <div className="flex items-center gap-1 rounded-full border border-line bg-bg-soft p-0.5">
                        <button
                          onClick={() => sub(m.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted hover:text-gold hover:bg-bg-elevated transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-gold font-semibold text-sm tabular-nums">{m.qty}</span>
                        <button
                          onClick={() => add(m.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted hover:text-gold hover:bg-bg-elevated transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 text-sm text-ink truncate text-right">{m.name}</div>
                      <div className="text-sm text-ink-muted whitespace-nowrap tabular-nums">
                        {formatILS(m.priceAgorot * m.qty)}
                      </div>
                    </div>
                  ))}
                {count === 0 && (
                  <div className="text-center py-10">
                    <ShoppingCart className="w-8 h-8 text-ink-dim mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-ink-muted">העגלה ריקה</p>
                    <p className="text-xs text-ink-dim mt-1">בחר/י פריטים מהתפריט</p>
                  </div>
                )}
              </div>
              <div className="border-t border-line mt-4 pt-4 flex items-center justify-between">
                <span className="text-ink-muted text-sm">סה״כ לתשלום</span>
                <span className="font-display text-3xl text-gold tabular-nums">{formatILS(subtotal)}</span>
              </div>
              <Button
                variant="gold"
                className="w-full mt-4 py-3.5 text-base"
                disabled={count === 0 || creating}
                onClick={createOrder}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "צור QR לתשלום"}
              </Button>
              <p className="text-center text-[11px] text-ink-dim mt-2">
                אפשר לפתוח כמה הזמנות במקביל — כל אחת נסרקת ומשולמת בנפרד
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Zoomed QR for the customer to scan */}
      {zoomOrder && <QrModal order={zoomOrder} onClose={() => setZoomId(null)} />}
    </div>
  );
}

/** A single open tab — polls its own payment status independently. */
function OpenOrderCard({
  order,
  onResolved,
  onZoom,
}: {
  order: OpenOrder;
  onResolved: (id: string) => void;
  onZoom: () => void;
}) {
  const [paid, setPaid] = useState(false);

  // Poll payment status (~1.2s) until paid / cancelled / expired.
  useEffect(() => {
    if (paid) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/venue/bar/orders/${order.id}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.status === "PAID") {
            setPaid(true);
            return;
          }
          if (data.status === "CANCELLED" || data.status === "EXPIRED") {
            onResolved(order.id);
            return;
          }
        }
      } catch {
        /* transient — keep polling */
      }
      if (!cancelled) timer = setTimeout(tick, 1200);
    };
    timer = setTimeout(tick, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paid, order.id, onResolved]);

  // Auto-clear a paid tab after a short confirmation.
  useEffect(() => {
    if (!paid) return;
    const t = setTimeout(() => onResolved(order.id), 4000);
    return () => clearTimeout(t);
  }, [paid, order.id, onResolved]);

  async function cancel() {
    await fetch(`/api/venue/bar/orders/${order.id}`, { method: "DELETE" }).catch(() => {});
    onResolved(order.id);
  }

  if (paid) {
    return (
      <div className="shrink-0 w-44 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4 flex flex-col items-center justify-center text-center gap-2">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        <div className="text-emerald-400 font-semibold">שולם!</div>
        <div className="font-display text-lg text-emerald-300 tabular-nums">{formatILS(order.subtotalAgorot)}</div>
      </div>
    );
  }

  return (
    <div className="shrink-0 w-44 rounded-2xl border border-gold/40 bg-gold/[0.06] p-3 text-center">
      <button
        onClick={onZoom}
        className="relative block w-full rounded-xl overflow-hidden group"
        title="הגדל QR"
      >
        <img src={order.qr} alt="QR לתשלום" className="w-full rounded-xl border border-line bg-white p-2" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </button>
      <div className="flex items-center justify-between mt-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-gold">
          <Loader2 className="w-3 h-3 animate-spin" /> ממתין
        </span>
        <span className="font-display text-base text-gold tabular-nums">{formatILS(order.subtotalAgorot)}</span>
      </div>
      <button
        onClick={cancel}
        className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-xs text-ink-muted hover:text-danger hover:border-danger/40 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> ביטול
      </button>
    </div>
  );
}

/** Full-screen QR so the customer can scan comfortably. */
function QrModal({ order, onClose }: { order: OpenOrder; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated relative p-8 text-center max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 rounded-full border border-line flex items-center justify-center text-ink-muted hover:text-ink"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="inline-flex items-center gap-2 text-gold mb-4">
          <Loader2 className="w-4 h-4 animate-spin" /> ממתין לתשלום…
        </div>
        <p className="text-sm text-ink-muted mb-4">הלקוח סורק את הקוד ומשלם מהטלפון</p>
        <div className="relative mx-auto w-[300px] h-[300px]">
          <span className="absolute inset-0 rounded-2xl border-2 border-gold/60 animate-ping" />
          <span className="absolute inset-0 rounded-2xl ring-1 ring-gold/30" />
          <img
            src={order.qr}
            alt="QR לתשלום"
            className="relative w-[300px] h-[300px] rounded-2xl border border-line bg-white p-3"
          />
        </div>
        <div className="font-display text-3xl text-gold mt-4 tabular-nums">{formatILS(order.subtotalAgorot)}</div>
        <a href={order.payUrl} target="_blank" className="text-xs text-ink-muted underline block mt-2">
          {order.payUrl}
        </a>
        <Button variant="gold" onClick={onClose} className="mt-6 w-full">
          המשך למכירה הבאה
        </Button>
      </div>
    </div>
  );
}
