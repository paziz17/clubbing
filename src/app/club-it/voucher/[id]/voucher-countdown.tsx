"use client";

import { useEffect, useState } from "react";

export function VoucherCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining("פג תוקף");
        return;
      }
      const h = Math.floor(diff / 3.6e6);
      const m = Math.floor((diff / 6e4) % 60);
      setRemaining(`פג תוקף בעוד ${h}:${String(m).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return <span className="text-warn">{remaining}</span>;
}
