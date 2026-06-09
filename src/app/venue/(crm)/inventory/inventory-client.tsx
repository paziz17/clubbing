"use client";

import { useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  Wallet,
  ShoppingCart,
  Plus,
  Minus,
  Pencil,
  Truck,
  ChefHat,
  X,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  History,
} from "lucide-react";

type Supplier = { id: string; name: string; phone?: string | null; email?: string | null; notes?: string | null };

type Item = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stockQty: number;
  parLevel: number;
  reorderQty: number;
  unitCostAgorot: number;
  supplierId?: string | null;
  supplier?: Supplier | null;
  sku?: string | null;
  active: boolean;
};

type Movement = {
  id: string;
  type: string;
  qty: number;
  reason?: string | null;
  createdAt: string;
  item: { name: string; unit: string };
};

type MenuLite = { id: string; name: string };
type Recipe = { id: string; menuItemId: string; inventoryItemId: string; qtyPerUnit: number; inventoryItem: { name: string; unit: string } };

const CATEGORIES: Record<string, string> = {
  ALCOHOL: "אלכוהול",
  BEER: "בירה",
  WINE: "יין",
  SOFT_DRINK: "שתייה קלה",
  MIXER: "מיקסר",
  FOOD: "מזון",
  PRODUCE: "ירקות ופירות",
  MEAT: "בשר",
  DAIRY: "חלב",
  SUPPLIES: "ציוד מתכלה",
  CLEANING: "ניקיון",
  OTHER: "אחר",
};

const UNITS: Record<string, string> = {
  BOTTLE: "בקבוק",
  CAN: "פחית",
  LITER: "ליטר",
  KG: 'ק"ג',
  GRAM: "גרם",
  UNIT: "יחידה",
  BOX: "ארגז",
  PACK: "חבילה",
};

const MOVE_LABEL: Record<string, { label: string; cls: string }> = {
  IN: { label: "כניסה", cls: "text-emerald-400" },
  OUT: { label: "יציאה", cls: "text-amber-400" },
  WASTE: { label: "בלאי", cls: "text-danger" },
  ADJUST: { label: "התאמה", cls: "text-sky-400" },
  SALE_AUTO: { label: "מכירה (אוטו')", cls: "text-ink-muted" },
};

function shekel(agorot: number) {
  return "₪" + (agorot / 100).toLocaleString("he-IL", { maximumFractionDigits: 0 });
}
function isLow(i: Item) {
  return i.parLevel > 0 && i.stockQty <= i.parLevel;
}
function num(n: number) {
  return n.toLocaleString("he-IL", { maximumFractionDigits: 2 });
}

export function InventoryClient({
  initialItems,
  initialSuppliers,
  movements,
  menu,
  recipes: initialRecipes,
}: {
  initialItems: Item[];
  initialSuppliers: Supplier[];
  movements: Movement[];
  menu: MenuLite[];
  recipes: Recipe[];
}) {
  const [tab, setTab] = useState<"stock" | "reorder" | "suppliers" | "recipes" | "history">("stock");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);

  const [itemModal, setItemModal] = useState<{ open: boolean; edit?: Item }>({ open: false });
  const [moveModal, setMoveModal] = useState<{ open: boolean; item?: Item }>({ open: false });
  const [supModal, setSupModal] = useState<{ open: boolean; edit?: Supplier }>({ open: false });

  const activeItems = items.filter((i) => i.active);
  const lowItems = activeItems.filter(isLow);
  const totalValue = activeItems.reduce((s, i) => s + i.stockQty * i.unitCostAgorot, 0);

  function upsertItem(it: Item) {
    setItems((prev) => (prev.some((x) => x.id === it.id) ? prev.map((x) => (x.id === it.id ? it : x)) : [...prev, it]));
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Package} label="פריטים פעילים" value={String(activeItems.length)} />
        <Kpi icon={AlertTriangle} label="מתחת לסף מלאי" value={String(lowItems.length)} danger={lowItems.length > 0} />
        <Kpi icon={Wallet} label="שווי מלאי" value={shekel(totalValue)} accent />
        <Kpi icon={ShoppingCart} label="להזמנה" value={String(lowItems.length)} />
      </div>

      <div className="flex items-center gap-1 border-b border-line overflow-x-auto">
        <TabBtn active={tab === "stock"} onClick={() => setTab("stock")}>מלאי</TabBtn>
        <TabBtn active={tab === "reorder"} onClick={() => setTab("reorder")}>
          התראות והזמנות {lowItems.length > 0 && <span className="mr-1 text-[10px] bg-danger/20 text-danger rounded-full px-1.5">{lowItems.length}</span>}
        </TabBtn>
        <TabBtn active={tab === "recipes"} onClick={() => setTab("recipes")}>מתכונים · ניכוי אוטומטי</TabBtn>
        <TabBtn active={tab === "suppliers"} onClick={() => setTab("suppliers")}>ספקים ({suppliers.length})</TabBtn>
        <TabBtn active={tab === "history"} onClick={() => setTab("history")}>תנועות</TabBtn>
      </div>

      {tab === "stock" && (
        <StockTab
          items={items}
          onAdd={() => setItemModal({ open: true })}
          onEdit={(i) => setItemModal({ open: true, edit: i })}
          onMove={(i) => setMoveModal({ open: true, item: i })}
        />
      )}

      {tab === "reorder" && <ReorderTab items={lowItems} />}

      {tab === "recipes" && (
        <RecipesTab menu={menu} items={activeItems} recipes={recipes} setRecipes={setRecipes} />
      )}

      {tab === "suppliers" && (
        <SuppliersTab
          suppliers={suppliers}
          onAdd={() => setSupModal({ open: true })}
          onEdit={(s) => setSupModal({ open: true, edit: s })}
        />
      )}

      {tab === "history" && <HistoryTab movements={movements} />}

      {itemModal.open && (
        <ItemModal
          edit={itemModal.edit}
          suppliers={suppliers}
          onClose={() => setItemModal({ open: false })}
          onSaved={(it) => { upsertItem(it); setItemModal({ open: false }); }}
        />
      )}
      {moveModal.open && moveModal.item && (
        <MoveModal
          item={moveModal.item}
          onClose={() => setMoveModal({ open: false })}
          onSaved={(it) => { upsertItem(it); setMoveModal({ open: false }); }}
        />
      )}
      {supModal.open && (
        <SupplierModal
          edit={supModal.edit}
          onClose={() => setSupModal({ open: false })}
          onSaved={(s) => {
            setSuppliers((prev) => (prev.some((x) => x.id === s.id) ? prev.map((x) => (x.id === s.id ? s : x)) : [...prev, s]));
            setSupModal({ open: false });
          }}
        />
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent, danger }: { icon: any; label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${danger ? "border-danger/30 bg-danger/5" : accent ? "border-gold/30 bg-gold/5" : "border-line bg-bg-soft"}`}>
      <div className="flex items-center gap-2 text-ink-muted text-xs mb-1.5">
        <Icon className={`w-4 h-4 ${danger ? "text-danger" : accent ? "text-gold" : ""}`} /> {label}
      </div>
      <div className={`text-2xl font-display ${danger ? "text-danger" : accent ? "text-gold" : "text-ink"}`}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${active ? "border-gold text-gold" : "border-transparent text-ink-muted hover:text-ink"}`}>
      {children}
    </button>
  );
}

function StockTab({ items, onAdd, onEdit, onMove }: { items: Item[]; onAdd: () => void; onEdit: (i: Item) => void; onMove: (i: Item) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const filtered = items.filter((i) => i.active && (!q || i.name.includes(q)) && (!cat || i.category === cat));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <input placeholder="חיפוש פריט…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[160px] bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-gold/50" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none">
          <option value="">כל הקטגוריות</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90">
          <Plus className="w-4 h-4" /> פריט חדש
        </button>
      </div>
      <div className="rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-bg-soft text-ink-muted text-xs">
            <tr>
              <th className="text-right px-4 py-2.5 font-medium">פריט</th>
              <th className="text-right px-4 py-2.5 font-medium">קטגוריה</th>
              <th className="text-right px-4 py-2.5 font-medium">מלאי</th>
              <th className="text-right px-4 py-2.5 font-medium">סף</th>
              <th className="text-right px-4 py-2.5 font-medium">עלות יח'</th>
              <th className="text-right px-4 py-2.5 font-medium">שווי</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const low = isLow(i);
              return (
                <tr key={i.id} className={`border-t border-line hover:bg-bg-soft/50 ${low ? "bg-danger/5" : ""}`}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-ink flex items-center gap-2">
                      {low && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                      {i.name}
                    </div>
                    {i.supplier && <div className="text-[11px] text-ink-dim">{i.supplier.name}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{CATEGORIES[i.category] ?? i.category}</td>
                  <td className="px-4 py-2.5">
                    <span className={low ? "text-danger font-semibold" : "text-ink"}>{num(i.stockQty)}</span>
                    <span className="text-ink-dim text-xs"> {UNITS[i.unit] ?? i.unit}</span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{i.parLevel > 0 ? num(i.parLevel) : "—"}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{shekel(i.unitCostAgorot)}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{shekel(i.stockQty * i.unitCostAgorot)}</td>
                  <td className="px-4 py-2.5 text-left whitespace-nowrap">
                    <button onClick={() => onMove(i)} title="תנועת מלאי" className="p-1.5 rounded hover:bg-bg-card text-ink-muted hover:text-gold"><History className="w-4 h-4" /></button>
                    <button onClick={() => onEdit(i)} title="עריכה" className="p-1.5 rounded hover:bg-bg-card text-ink-muted hover:text-gold"><Pencil className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-dim text-sm">אין פריטים</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReorderTab({ items }: { items: Item[] }) {
  const lines = items.map((i) => {
    const suggested = i.reorderQty > 0 ? i.reorderQty : Math.max(0, Math.ceil((i.parLevel - i.stockQty) || 0));
    return { ...i, suggested, cost: suggested * i.unitCostAgorot };
  });
  const totalCost = lines.reduce((s, l) => s + l.cost, 0);

  function copyList() {
    const grouped: Record<string, string[]> = {};
    for (const l of lines) {
      const sup = l.supplier?.name ?? "ללא ספק";
      (grouped[sup] ??= []).push(`• ${l.name}: ${num(l.suggested)} ${UNITS[l.unit] ?? l.unit}`);
    }
    const text = Object.entries(grouped).map(([sup, rows]) => `${sup}:\n${rows.join("\n")}`).join("\n\n");
    navigator.clipboard?.writeText(text);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-bg-soft p-8 text-center text-ink-muted text-sm">
        <Package className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
        כל הפריטים מעל סף המלאי. אין צורך בהזמנה כרגע.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-muted">פריטים שהגיעו לסף המלאי — הצעת הזמנה אוטומטית</div>
        <button onClick={copyList} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/40 text-gold text-sm hover:bg-gold/10">
          <ShoppingCart className="w-4 h-4" /> העתק רשימת הזמנה
        </button>
      </div>
      <div className="rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-bg-soft text-ink-muted text-xs">
            <tr>
              <th className="text-right px-4 py-2.5 font-medium">פריט</th>
              <th className="text-right px-4 py-2.5 font-medium">מלאי / סף</th>
              <th className="text-right px-4 py-2.5 font-medium">להזמנה</th>
              <th className="text-right px-4 py-2.5 font-medium">ספק</th>
              <th className="text-right px-4 py-2.5 font-medium">עלות משוערת</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium text-ink">{l.name}</td>
                <td className="px-4 py-2.5"><span className="text-danger font-semibold">{num(l.stockQty)}</span> <span className="text-ink-dim">/ {num(l.parLevel)}</span></td>
                <td className="px-4 py-2.5 text-gold font-semibold">{num(l.suggested)} {UNITS[l.unit] ?? l.unit}</td>
                <td className="px-4 py-2.5 text-ink-muted">{l.supplier?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-ink-muted">{shekel(l.cost)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-bg-soft">
              <td colSpan={4} className="px-4 py-2.5 text-left font-medium text-ink">סה"כ משוער</td>
              <td className="px-4 py-2.5 text-gold font-bold">{shekel(totalCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function RecipesTab({ menu, items, recipes, setRecipes }: { menu: MenuLite[]; items: Item[]; recipes: Recipe[]; setRecipes: (r: Recipe[]) => void }) {
  const [selectedMenu, setSelectedMenu] = useState(menu[0]?.id ?? "");
  const [invId, setInvId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);

  const links = recipes.filter((r) => r.menuItemId === selectedMenu);

  async function addLink() {
    if (!selectedMenu || !invId) return;
    setBusy(true);
    const res = await fetch("/api/venue/inventory/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuItemId: selectedMenu, inventoryItemId: invId, qtyPerUnit: parseFloat(qty || "0") }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.link) {
      setRecipes([...recipes.filter((r) => r.id !== data.link.id), data.link]);
    }
  }

  async function removeLink(id: string) {
    await fetch(`/api/venue/inventory/recipe/${id}`, { method: "DELETE" });
    setRecipes(recipes.filter((r) => r.id !== id));
  }

  if (menu.length === 0) {
    return <div className="rounded-xl border border-line bg-bg-soft p-8 text-center text-ink-muted text-sm">אין פריטי תפריט פעילים. הוסף פריטים במטבח כדי לחבר אותם למלאי.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-sm text-ink-muted bg-bg-card border border-line rounded-lg p-3">
        <ChefHat className="w-4 h-4 text-gold mt-0.5 shrink-0" />
        <span>כל מנה שתחובר לכאן תנכה אוטומטית את מרכיביה מהמלאי בכל הזמנה — ב-WEB, באפליקציה וב-CRM.</span>
      </div>
      <div>
        <label className="block text-xs text-ink-muted mb-1">בחר מנה מהתפריט</label>
        <select value={selectedMenu} onChange={(e) => setSelectedMenu(e.target.value)} className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none">
          {menu.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-line overflow-hidden">
        <div className="px-4 py-2.5 bg-bg-soft text-xs text-ink-muted font-medium">מרכיבים מנוכים</div>
        {links.length === 0 ? (
          <div className="px-4 py-6 text-center text-ink-dim text-sm">אין מרכיבים מקושרים למנה זו</div>
        ) : (
          links.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-2.5 border-t border-line">
              <span className="text-sm text-ink">{r.inventoryItem.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-muted">{num(r.qtyPerUnit)} {UNITS[r.inventoryItem.unit] ?? r.inventoryItem.unit} / מנה</span>
                <button onClick={() => removeLink(r.id)} className="p-1 rounded hover:bg-danger/10 text-ink-muted hover:text-danger"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-ink-muted mb-1">מרכיב מהמלאי</label>
            <select value={invId} onChange={(e) => setInvId(e.target.value)} className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none">
              {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs text-ink-muted mb-1">כמות למנה</label>
            <input type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none" />
          </div>
          <button onClick={addLink} disabled={busy} className="px-4 py-2 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90 disabled:opacity-50">
            הוסף מרכיב
          </button>
        </div>
      )}
    </div>
  );
}

function SuppliersTab({ suppliers, onAdd, onEdit }: { suppliers: Supplier[]; onAdd: () => void; onEdit: (s: Supplier) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90">
          <Plus className="w-4 h-4" /> ספק חדש
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suppliers.map((s) => (
          <div key={s.id} className="rounded-xl border border-line bg-bg-soft p-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 font-medium text-ink"><Truck className="w-4 h-4 text-gold" />{s.name}</div>
              {s.phone && <div className="text-xs text-ink-muted mt-1" dir="ltr">{s.phone}</div>}
              {s.email && <div className="text-xs text-ink-dim" dir="ltr">{s.email}</div>}
              {s.notes && <div className="text-xs text-ink-dim mt-1">{s.notes}</div>}
            </div>
            <button onClick={() => onEdit(s)} className="p-1.5 rounded hover:bg-bg-card text-ink-muted hover:text-gold"><Pencil className="w-4 h-4" /></button>
          </div>
        ))}
        {suppliers.length === 0 && <div className="col-span-full text-center text-ink-dim text-sm py-8">אין ספקים עדיין</div>}
      </div>
    </div>
  );
}

function HistoryTab({ movements }: { movements: Movement[] }) {
  return (
    <div className="rounded-xl border border-line overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-bg-soft text-ink-muted text-xs">
          <tr>
            <th className="text-right px-4 py-2.5 font-medium">תאריך</th>
            <th className="text-right px-4 py-2.5 font-medium">פריט</th>
            <th className="text-right px-4 py-2.5 font-medium">סוג</th>
            <th className="text-right px-4 py-2.5 font-medium">כמות</th>
            <th className="text-right px-4 py-2.5 font-medium">סיבה</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-t border-line">
              <td className="px-4 py-2.5 text-ink-dim text-xs">{new Date(m.createdAt).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
              <td className="px-4 py-2.5 text-ink">{m.item?.name}</td>
              <td className={`px-4 py-2.5 ${MOVE_LABEL[m.type]?.cls}`}>{MOVE_LABEL[m.type]?.label ?? m.type}</td>
              <td className={`px-4 py-2.5 font-medium ${m.qty >= 0 ? "text-emerald-400" : "text-danger"}`}>{m.qty >= 0 ? "+" : ""}{num(m.qty)}</td>
              <td className="px-4 py-2.5 text-ink-muted text-xs">{m.reason || "—"}</td>
            </tr>
          ))}
          {movements.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-dim text-sm">אין תנועות מלאי</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-soft border border-line rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-bg-soft">
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-card text-ink-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-gold/50 outline-none";
const labelCls = "block text-xs text-ink-muted mb-1";

function ItemModal({ edit, suppliers, onClose, onSaved }: { edit?: Item; suppliers: Supplier[]; onClose: () => void; onSaved: (i: Item) => void }) {
  const [name, setName] = useState(edit?.name ?? "");
  const [category, setCategory] = useState(edit?.category ?? "ALCOHOL");
  const [unit, setUnit] = useState(edit?.unit ?? "BOTTLE");
  const [stockQty, setStockQty] = useState(String(edit?.stockQty ?? 0));
  const [parLevel, setParLevel] = useState(String(edit?.parLevel ?? 0));
  const [reorderQty, setReorderQty] = useState(String(edit?.reorderQty ?? 0));
  const [cost, setCost] = useState(((edit?.unitCostAgorot ?? 0) / 100).toString());
  const [supplierId, setSupplierId] = useState(edit?.supplierId ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (name.trim().length < 1) { setErr("חסר שם"); return; }
    setBusy(true); setErr("");
    const payload: any = {
      name: name.trim(), category, unit,
      parLevel: parseFloat(parLevel || "0"),
      reorderQty: parseFloat(reorderQty || "0"),
      unitCostAgorot: Math.round(parseFloat(cost || "0") * 100),
      supplierId: supplierId || null,
    };
    if (!edit) payload.stockQty = parseFloat(stockQty || "0");
    const res = await fetch(edit ? `/api/venue/inventory/${edit.id}` : "/api/venue/inventory", {
      method: edit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (data.item) onSaved(data.item);
    else setErr("שגיאה בשמירה");
  }

  return (
    <Modal title={edit ? "עריכת פריט" : "פריט מלאי חדש"} onClose={onClose}>
      {err && <div className="text-xs text-danger">{err}</div>}
      <div><label className={labelCls}>שם הפריט</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>קטגוריה</label>
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>יחידת מידה</label>
          <select className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)}>
            {Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {!edit && <div><label className={labelCls}>מלאי נוכחי</label><input type="number" step="0.01" className={inputCls} value={stockQty} onChange={(e) => setStockQty(e.target.value)} /></div>}
        <div><label className={labelCls}>עלות ליחידה (₪)</label><input type="number" step="0.01" className={inputCls} value={cost} onChange={(e) => setCost(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>סף התראה</label><input type="number" step="0.01" className={inputCls} value={parLevel} onChange={(e) => setParLevel(e.target.value)} /></div>
        <div><label className={labelCls}>כמות הזמנה</label><input type="number" step="0.01" className={inputCls} value={reorderQty} onChange={(e) => setReorderQty(e.target.value)} /></div>
      </div>
      <div>
        <label className={labelCls}>ספק</label>
        <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">— ללא —</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <button onClick={save} disabled={busy} className="w-full py-2.5 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90 disabled:opacity-50">{busy ? "שומר…" : "שמירה"}</button>
    </Modal>
  );
}

function MoveModal({ item, onClose, onSaved }: { item: Item; onClose: () => void; onSaved: (i: Item) => void }) {
  const [type, setType] = useState<"IN" | "OUT" | "WASTE" | "ADJUST">("IN");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const TYPES: { k: typeof type; label: string; icon: any }[] = [
    { k: "IN", label: "כניסה", icon: ArrowDownToLine },
    { k: "OUT", label: "יציאה", icon: ArrowUpFromLine },
    { k: "WASTE", label: "בלאי", icon: Ban },
    { k: "ADJUST", label: "התאמה +/-", icon: Minus },
  ];

  async function save() {
    setBusy(true); setErr("");
    const q = parseFloat(qty || "0");
    const res = await fetch(`/api/venue/inventory/${item.id}/movement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, qty: Math.abs(q) || 0.0001, reason: reason || null }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.item) onSaved(data.item);
    else setErr("שגיאה ברישום התנועה");
  }

  return (
    <Modal title={`תנועת מלאי · ${item.name}`} onClose={onClose}>
      {err && <div className="text-xs text-danger">{err}</div>}
      <div className="text-xs text-ink-muted">מלאי נוכחי: <span className="text-ink font-medium">{num(item.stockQty)} {UNITS[item.unit] ?? item.unit}</span></div>
      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.k} onClick={() => setType(t.k)} className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs ${type === t.k ? "border-gold bg-gold/10 text-gold" : "border-line text-ink-muted hover:bg-bg-card"}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>
      <div><label className={labelCls}>כמות {type === "ADJUST" ? "(חיובי מוסיף, שלילי מוריד)" : ""}</label><input type="number" step="0.01" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
      <div><label className={labelCls}>סיבה / הערה</label><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="קבלת סחורה, שבירה, ספירה…" /></div>
      <button onClick={save} disabled={busy} className="w-full py-2.5 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90 disabled:opacity-50">{busy ? "רושם…" : "רישום תנועה"}</button>
    </Modal>
  );
}

function SupplierModal({ edit, onClose, onSaved }: { edit?: Supplier; onClose: () => void; onSaved: (s: Supplier) => void }) {
  const [name, setName] = useState(edit?.name ?? "");
  const [phone, setPhone] = useState(edit?.phone ?? "");
  const [email, setEmail] = useState(edit?.email ?? "");
  const [notes, setNotes] = useState(edit?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (name.trim().length < 1) { setErr("חסר שם"); return; }
    setBusy(true); setErr("");
    const res = await fetch(edit ? `/api/venue/suppliers/${edit.id}` : "/api/venue/suppliers", {
      method: edit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone || null, email: email || null, notes: notes || null }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.supplier) onSaved(data.supplier);
    else setErr("שגיאה בשמירה");
  }

  return (
    <Modal title={edit ? "עריכת ספק" : "ספק חדש"} onClose={onClose}>
      {err && <div className="text-xs text-danger">{err}</div>}
      <div><label className={labelCls}>שם הספק</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>טלפון</label><input dir="ltr" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><label className={labelCls}>אימייל</label><input dir="ltr" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <div><label className={labelCls}>הערות</label><input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <button onClick={save} disabled={busy} className="w-full py-2.5 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90 disabled:opacity-50">{busy ? "שומר…" : "שמירה"}</button>
    </Modal>
  );
}
