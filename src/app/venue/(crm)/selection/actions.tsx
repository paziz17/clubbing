"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";

export function SelectionActions({ appId }: { appId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function decide(status: "APPROVED" | "REJECTED") {
    setLoading(true);
    await fetch("/api/venue/selection", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId, status, reason }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => decide("APPROVED")} disabled={loading}>
        אשר
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="danger">
            דחה
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>סיבת דחייה (אופציונלי)</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ההסבר יוצג לבליין/ית..."
            rows={3}
          />
          <Button variant="danger" onClick={() => decide("REJECTED")} disabled={loading}>
            דחה בקשה
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
