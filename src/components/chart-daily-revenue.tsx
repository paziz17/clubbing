"use client";

import { useState } from "react";
import { formatILS } from "@/lib/utils";

interface Props {
  data: { date: string; amount: number }[];
}

export function ChartDailyRevenue({ data }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.amount));

  return (
    <div className="relative h-64">
      <div className="flex items-end gap-1 h-full">
        {data.map((d, i) => {
          const h = (d.amount / max) * 100;
          const active = hover === i;
          return (
            <div
              key={d.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="flex-1 flex flex-col items-center justify-end cursor-pointer group"
            >
              <div
                className={`w-full rounded-t transition-all ${
                  active ? "bg-gold-glow" : "bg-gold-gradient opacity-70 group-hover:opacity-100"
                }`}
                style={{ height: `${Math.max(h, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      {hover !== null && (
        <div
          className="absolute -top-2 z-10 px-3 py-2 rounded-lg bg-bg-elevated border border-line shadow-card pointer-events-none text-xs"
          style={{
            right: `${(1 - hover / data.length) * 100}%`,
            transform: "translateX(50%)",
          }}
        >
          <div className="text-ink-muted">{data[hover].date}</div>
          <div className="text-gold font-semibold">{formatILS(data[hover].amount)}</div>
        </div>
      )}
    </div>
  );
}
