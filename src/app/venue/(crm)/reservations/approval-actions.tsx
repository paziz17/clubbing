"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ApprovalActions({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);

  async function approve() {
    setBusy("approve");
    const res = await fetch(`/api/venue/reservations/${reservationId}/approve`, {
      method: "POST",
    });
    setBusy(null);
    if (res.ok) router.refresh();
    else alert("האישור נכשל");
  }

  async function reject() {
    const reason = prompt("סיבת דחייה (אופציונלי):") ?? undefined;
    setBusy("reject");
    const res = await fetch(`/api/venue/reservations/${reservationId}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setBusy(null);
    if (res.ok) router.refresh();
    else alert("הדחייה נכשלה");
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={approve} disabled={busy !== null}>
        <Check className="w-3.5 h-3.5" /> {busy === "approve" ? "..." : "אשר"}
      </Button>
      <Button size="sm" variant="danger" onClick={reject} disabled={busy !== null}>
        <X className="w-3.5 h-3.5" /> {busy === "reject" ? "..." : "דחה"}
      </Button>
    </div>
  );
}
