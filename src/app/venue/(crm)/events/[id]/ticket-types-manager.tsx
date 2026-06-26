"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TicketType {
  id: string;
  kind: string;
  label: string;
  priceAgorot: number;
  stock: number | null;
  sold: number;
  active: boolean;
  salesStartAt: string | null;
  salesEndAt: string | null;
}

// Convert a date to the value a <input type="datetime-local"> expects.
function toLocalInput(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function TicketTypesManager({
  eventId,
  tickets,
}: {
  eventId: string;
  tickets: TicketType[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function addTicket() {
    setBusy(true);
    await fetch(`/api/venue/events/${eventId}/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "STANDARD", label: "כרטיס חדש", priceAgorot: 10000 }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">סוגי כרטיסים ומלאי</h3>
        <Button size="sm" variant="ghost" onClick={addTicket} disabled={busy}>
          <Plus className="w-4 h-4" /> סוג כרטיס
        </Button>
      </div>
      <div className="space-y-2">
        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} />
        ))}
        {tickets.length === 0 && (
          <p className="text-sm text-ink-muted">אין סוגי כרטיסים — הוסף/י אחד</p>
        )}
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: TicketType }) {
  const router = useRouter();
  const [form, setForm] = useState({
    label: ticket.label,
    price: (ticket.priceAgorot / 100).toString(),
    stock: ticket.stock?.toString() ?? "",
    salesStartAt: toLocalInput(ticket.salesStartAt),
    salesEndAt: toLocalInput(ticket.salesEndAt),
    active: ticket.active,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/venue/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: form.label,
        priceAgorot: Math.round(Number(form.price) * 100),
        stock: form.stock === "" ? null : Number(form.stock),
        salesStartAt: form.salesStartAt ? new Date(form.salesStartAt).toISOString() : null,
        salesEndAt: form.salesEndAt ? new Date(form.salesEndAt).toISOString() : null,
        active: form.active,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("למחוק את סוג הכרטיס?")) return;
    await fetch(`/api/venue/tickets/${ticket.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-line p-3 space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] text-ink-muted mb-0.5">שם</label>
          <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[10px] text-ink-muted mb-0.5">מחיר (₪)</label>
          <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[10px] text-ink-muted mb-0.5">
            מלאי {ticket.sold > 0 && <span className="text-gold">(נמכרו {ticket.sold})</span>}
          </label>
          <Input
            type="number"
            placeholder="ללא הגבלה"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
          />
        </div>
        <label className="flex items-center gap-2 mt-5 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="w-4 h-4"
          />
          פעיל
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-ink-muted mb-0.5">תחילת מכירה</label>
          <Input
            type="datetime-local"
            value={form.salesStartAt}
            onChange={(e) => setForm((f) => ({ ...f, salesStartAt: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-[10px] text-ink-muted mb-0.5">סיום מכירה</label>
          <Input
            type="datetime-local"
            value={form.salesEndAt}
            onChange={(e) => setForm((f) => ({ ...f, salesEndAt: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="danger" onClick={remove}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" onClick={save} disabled={saving}>
          <Save className="w-3.5 h-3.5" /> {saving ? "..." : "שמור"}
        </Button>
      </div>
    </div>
  );
}
