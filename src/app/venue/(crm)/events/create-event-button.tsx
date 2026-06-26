"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateEventButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    time: "23:00",
    location: "",
    address: "",
    description: "",
    basePrice: "110",
    capacity: "200",
    tags: "",
    approvalPolicy: "AUTO" as "AUTO" | "MANUAL",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setLoading(true);
    const startsAt = new Date(`${form.date}T${form.time}`).toISOString();
    const res = await fetch("/api/venue/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        startsAt,
        description: form.description,
        basePriceAgorot: Math.round(Number(form.basePrice) * 100),
        capacity: Number(form.capacity),
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        approvalPolicy: form.approvalPolicy,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="w-4 h-4" /> אירוע חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>יצירת אירוע חדש</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-ink-muted mb-1">שם האירוע *</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Block Party — Saturday Late Night" />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">תאריך *</label>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">שעה</label>
            <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-ink-muted mb-1">כתובת</label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="רחוב הלחי 5, תל אביב" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-ink-muted mb-1">תיאור</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">מחיר בסיס (₪)</label>
            <Input type="number" value={form.basePrice} onChange={(e) => set("basePrice", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">תפוסה</label>
            <Input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-ink-muted mb-1">תגיות (מופרדות בפסיק)</label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="techno, +21, saturday" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-ink-muted mb-1">אישור כרטיסים</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set("approvalPolicy", "AUTO")}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  form.approvalPolicy === "AUTO"
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line text-ink-muted hover:border-gold/40"
                }`}
              >
                אוטומטי
                <span className="block text-[11px] opacity-70">מעבר ישיר לתשלום</span>
              </button>
              <button
                type="button"
                onClick={() => set("approvalPolicy", "MANUAL")}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  form.approvalPolicy === "MANUAL"
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line text-ink-muted hover:border-gold/40"
                }`}
              >
                ידני (סלקציה)
                <span className="block text-[11px] opacity-70">אישור לפני תשלום</span>
              </button>
            </div>
          </div>
        </div>
        <Button onClick={submit} disabled={loading || !form.name || !form.date} className="mt-2">
          {loading ? "..." : "צור אירוע"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
