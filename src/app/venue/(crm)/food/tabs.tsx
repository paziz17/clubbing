"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatILS, timeAgoHe } from "@/lib/utils";
import { parseJson } from "@/lib/enums";

interface OrderItem {
  itemId: string;
  name: string;
  qty: number;
  priceAgorot: number;
}

interface Props {
  menu: any[];
  orders: any[];
  venueId: string;
}

const CATEGORIES = [
  { id: "PIZZA", label: "פיצה", emoji: "🍕" },
  { id: "STARTER", label: "מנות פתיחה", emoji: "🥗" },
  { id: "MAIN", label: "עיקרי", emoji: "🍝" },
  { id: "DRINK", label: "שתייה", emoji: "🥤" },
  { id: "DESSERT", label: "קינוח", emoji: "🍰" },
];

export function FoodTabs({ menu: initialMenu, orders: initialOrders, venueId }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "menu">("orders");
  const [orders, setOrders] = useState(initialOrders);
  const [menu, setMenu] = useState(initialMenu);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    category: "PIZZA",
    priceShekels: "60",
    prepMinutes: "15",
  });

  async function updateOrder(id: string, status: string) {
    await fetch(`/api/venue/food/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function addMenuItem() {
    setAdding(true);
    const res = await fetch("/api/venue/food/menu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        category: draft.category,
        priceAgorot: Math.round(Number(draft.priceShekels) * 100),
        prepMinutes: Number(draft.prepMinutes),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setMenu([data.item, ...menu]);
      setDraft({ name: "", category: "PIZZA", priceShekels: "60", prepMinutes: "15" });
    }
    setAdding(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/venue/food/menu/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setMenu((m) => m.map((x: any) => (x.id === id ? { ...x, active } : x)));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "orders"
              ? "bg-gold/15 text-gold border border-gold/40"
              : "bg-bg-soft text-ink-muted border border-line"
          }`}
        >
          הזמנות ({orders.filter((o: any) => o.status !== "COLLECTED").length})
        </button>
        <button
          onClick={() => setTab("menu")}
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "menu"
              ? "bg-gold/15 text-gold border border-gold/40"
              : "bg-bg-soft text-ink-muted border border-line"
          }`}
        >
          תפריט ({menu.length})
        </button>
      </div>

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-ink">{o.user?.name ?? "אורח"}</span>
                    <Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge>
                  </div>
                  <div className="text-xs text-ink-muted">
                    קוד איסוף: <span className="font-mono text-gold">{o.pickupCode}</span> · {timeAgoHe(o.createdAt)}
                  </div>
                  <ul className="text-sm text-ink mt-2 space-y-0.5">
                    {parseJson<OrderItem[]>(o.items, []).map((item, i) => (
                      <li key={i}>
                        × {item.qty} · {item.name} · {formatILS(item.priceAgorot * item.qty)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-gold">{formatILS(o.subtotalAgorot)}</div>
                  {o.creditsApplied > 0 && (
                    <div className="text-xs text-emerald-400">
                      קרדיטים: {o.creditsApplied}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {o.status === "PENDING" && (
                  <Button size="sm" onClick={() => updateOrder(o.id, "PREPARING")}>
                    → התחל הכנה
                  </Button>
                )}
                {o.status === "PREPARING" && (
                  <Button size="sm" onClick={() => updateOrder(o.id, "READY")}>
                    → מוכן לאיסוף
                  </Button>
                )}
                {o.status === "READY" && (
                  <Button size="sm" variant="ghost" onClick={() => updateOrder(o.id, "COLLECTED")}>
                    → סמן כנאסף
                  </Button>
                )}
                {o.status !== "COLLECTED" && o.status !== "CANCELLED" && (
                  <Button size="sm" variant="danger" onClick={() => updateOrder(o.id, "CANCELLED")}>
                    בטל
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {orders.length === 0 && (
            <Card className="p-12 text-center text-ink-muted">אין הזמנות עדיין</Card>
          )}
        </div>
      )}

      {tab === "menu" && (
        <>
          <Card className="p-4">
            <div className="grid grid-cols-5 gap-2">
              <Input
                placeholder="שם פריט"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <select
                className="input"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
              <Input
                placeholder="מחיר ₪"
                type="number"
                value={draft.priceShekels}
                onChange={(e) => setDraft({ ...draft, priceShekels: e.target.value })}
              />
              <Input
                placeholder="זמן הכנה"
                type="number"
                value={draft.prepMinutes}
                onChange={(e) => setDraft({ ...draft, prepMinutes: e.target.value })}
              />
              <Button onClick={addMenuItem} disabled={adding || !draft.name}>
                + הוסף
              </Button>
            </div>
          </Card>

          {CATEGORIES.map((cat) => {
            const items = menu.filter((m: any) => m.category === cat.id);
            if (items.length === 0) return null;
            return (
              <Card key={cat.id} className="p-4">
                <h3 className="font-semibold text-ink mb-3">{cat.emoji} {cat.label}</h3>
                <div className="space-y-2">
                  {items.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-bg-soft rounded-lg">
                      <div className="flex-1">
                        <div className="text-ink">{m.name}</div>
                        <div className="text-xs text-ink-muted">{m.prepMinutes} דקות הכנה</div>
                      </div>
                      <div className="text-gold mr-3 font-semibold">{formatILS(m.priceAgorot)}</div>
                      <Button
                        size="sm"
                        variant={m.active ? "ghost" : "outline"}
                        onClick={() => toggleActive(m.id, !m.active)}
                      >
                        {m.active ? "השבת" : "הפעל"}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

function statusVariant(s: string): "default" | "warn" | "info" | "success" | "danger" {
  return s === "PENDING"
    ? "warn"
    : s === "PREPARING"
    ? "info"
    : s === "READY"
    ? "gold" as any
    : s === "COLLECTED"
    ? "success"
    : "default";
}

function statusLabel(s: string) {
  return (
    { PENDING: "ממתין", PREPARING: "בהכנה", READY: "מוכן", COLLECTED: "נאסף", CANCELLED: "בוטל" }[s] ??
    s
  );
}
