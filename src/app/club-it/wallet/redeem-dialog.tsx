"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCredits } from "@/lib/utils";

interface Props {
  venueId: string;
  venueName: string;
  available: number;
}

export function RedeemDialog({ venueId, venueName, available }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    setLoading(true);
    const res = await fetch("/api/club-it/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venueId, amount: Number(amount) }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.voucherId) {
      router.push(`/club-it/voucher/${data.voucherId}`);
    } else {
      alert(data.error ?? "מימוש נכשל");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-gold hover:underline mt-1">מממש</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>מימוש קרדיטים · {venueName}</DialogTitle>
          <DialogDescription>
            יתרה זמינה: {formatCredits(available)} קרדיטים
          </DialogDescription>
        </DialogHeader>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="כמה לממש?"
          max={available}
          min={50}
        />
        <Button
          onClick={handleRedeem}
          disabled={loading || !amount || Number(amount) < 50 || Number(amount) > available}
        >
          {loading ? "..." : "צור וצ'ר"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
