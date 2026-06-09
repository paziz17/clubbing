"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  variant?: "gold" | "silver" | "platinum";
}

export function Progress({
  value,
  variant = "gold",
  className,
  ...props
}: ProgressProps) {
  const colors: Record<string, string> = {
    gold: "bg-gold-gradient",
    silver: "bg-gradient-to-r from-gray-300 to-gray-500",
    platinum: "bg-gradient-to-r from-sky-300 to-sky-500",
  };
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-bg-soft border border-line",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-500", colors[variant])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
