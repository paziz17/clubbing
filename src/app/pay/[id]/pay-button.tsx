"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PayButton({
  reservationId,
  token,
}: {
  reservationId: string;
  token: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reservationId, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "התשלום נכשל");
        setLoading(false);
        return;
      }
      if (data.status === "checkout" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      // Demo / already-paid → straight to the ticket.
      router.push(`/tickets/${reservationId}`);
    } catch {
      setError("התשלום נכשל, נסה/י שוב");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <Button onClick={pay} disabled={loading} variant="gold" className="w-full">
        {loading ? "מעבר לתשלום..." : "להשלמת התשלום"}
      </Button>
      {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
