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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreatePromoterButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", commissionPct: "10" });

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/venue/promoters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        commissionPct: Number(form.commissionPct) || 0,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm({ name: "", phone: "", email: "", commissionPct: "10" });
      router.refresh();
    } else {
      alert("יצירת היחצן נכשלה");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="w-4 h-4" /> יחצן חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>יחצן חדש</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-ink-muted mb-1">שם *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-muted mb-1">טלפון</label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">עמלה (%)</label>
              <Input
                type="number"
                value={form.commissionPct}
                onChange={(e) => setForm((f) => ({ ...f, commissionPct: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">אימייל</label>
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
        <Button onClick={submit} disabled={loading || form.name.length < 2} className="mt-3">
          {loading ? "..." : "צור יחצן"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
