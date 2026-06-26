"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export function ReservationsFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const status = sp.get("status") ?? "all";

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      router.replace(`/venue/reservations?${params.toString()}`);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setStatus(s: string) {
    const params = new URLSearchParams(sp.toString());
    if (s === "all") params.delete("status");
    else params.set("status", s);
    router.replace(`/venue/reservations?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input pr-10"
          placeholder="חיפוש (שם / טלפון / מייל)"
        />
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="input h-11 w-44"
      >
        <option value="all">כל הסטטוסים</option>
        <option value="PENDING_APPROVAL">ממתין לאישור</option>
        <option value="PENDING_PAYMENT">ממתין לתשלום</option>
        <option value="PAID">שולם</option>
        <option value="REJECTED">נדחה</option>
        <option value="EXPIRED">פג תוקף</option>
        <option value="REFUNDED">הוחזר</option>
        <option value="CANCELLED">בוטל</option>
      </select>
    </div>
  );
}
