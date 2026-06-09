"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatILS, formatCredits } from "@/lib/utils";
import { Minus, Plus, ShoppingBag } from "lucide-react";

const CAT_ORDER = ["PIZZA", "STARTER", "MAIN", "DRINK", "DESSERT"];
const CAT_LABELS: Record<string, { label: string; emoji: string }> = {
  PIZZA: { label: "פיצה", emoji: "🍕" },
  STARTER: { label: "מנות פתיחה", emoji: "🥗" },
  MAIN: { label: "עיקרי", emoji: "🍝" },
  DRINK: { label: "שתייה", emoji: "🥤" },
  DESSERT: { label: "קינוח", emoji: "🍰" },
};

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  priceAgorot: number;
  prepMinutes: number;
  imageUrl?: string | null;
}

export function FoodOrderFlow({
  venue,
  menu,
}: {
  venue: { id: string; name: string };
  menu: MenuItem[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [credits, setCredits] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([itemId, qty]) => {
          const item = menu.find((m) => m.id === itemId)!;
          return { ...item, qty };
        }),
    [cart, menu]
  );
  const subtotal = cartItems.reduce((s, i) => s + i.priceAgorot * i.qty, 0);
  const final = Math.max(0, subtotal - credits);

  function update(itemId: string, delta: number) {
    setCart((c) => {
      const next = { ...c, [itemId]: Math.max(0, (c[itemId] ?? 0) + delta) };
      return next;
    });
  }

  async function placeOrder() {
    setSubmitting(true);
    const res = await fetch("/api/food/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        venueId: venue.id,
        items: cartItems.map((i) => ({ itemId: i.id, qty: i.qty })),
        creditsApplied: credits,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.orderId) router.push(`/food/order/${data.orderId}`);
  }

  return (
    <div className="mobile-screen pb-32">
      <div className="px-5 pt-8 pb-3">
        <h1 className="font-display text-2xl text-gold mb-1">{venue.name} · מטבח</h1>
        <p className="text-sm text-ink-muted">הזמן מראש — האוכל יחכה מוכן</p>
      </div>

      <div className="px-5 space-y-6">
        {CAT_ORDER.map((cat) => {
          const items = menu.filter((m) => m.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat}>
              <h3 className="text-sm font-semibold text-ink mb-2">
                {CAT_LABELS[cat].emoji} {CAT_LABELS[cat].label}
              </h3>
              <div className="space-y-2">
                {items.map((m) => {
                  const qty = cart[m.id] ?? 0;
                  return (
                    <div key={m.id} className="card-elevated p-3 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg bg-gold/10 flex items-center justify-center text-2xl">
                        {CAT_LABELS[cat].emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink truncate">{m.name}</div>
                        {m.description && (
                          <div className="text-xs text-ink-muted truncate">{m.description}</div>
                        )}
                        <div className="text-xs text-ink-dim">{m.prepMinutes} דקות הכנה</div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="text-gold font-semibold mb-1">{formatILS(m.priceAgorot)}</div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => update(m.id, -1)} className="w-7 h-7 rounded-full border border-line flex items-center justify-center">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{qty}</span>
                          <button onClick={() => update(m.id, 1)} className="w-7 h-7 rounded-full border border-gold/40 flex items-center justify-center text-gold">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 right-0 left-0 z-30 glass border-t border-line p-4 max-w-md mx-auto space-y-3">
          <div>
            <label className="text-xs text-ink-muted">מימוש קרדיטים: {formatCredits(credits)}</label>
            <input
              type="range"
              min={0}
              max={subtotal}
              step={50}
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>
          <button onClick={placeOrder} disabled={submitting} className="btn-gold w-full h-12">
            <ShoppingBag className="w-4 h-4" />
            {cartItems.reduce((s, i) => s + i.qty, 0)} פריטים · {formatILS(final)}
            {credits > 0 && (
              <span className="text-xs">(− {formatCredits(credits)})</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
