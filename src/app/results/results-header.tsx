"use client";

import Link from "next/link";
import { Pencil, ArrowRight } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export function ResultsHeader({ vibe }: { vibe: string }) {
  return (
    <div className="sticky top-0 z-10 glass border-b border-line px-4 py-3 flex items-center justify-between gap-2">
      <Link
        href="/discover"
        aria-label="חזור לבחירת מסיבה"
        className="inline-flex items-center gap-1 text-sm text-gold/80 hover:text-gold shrink-0"
      >
        <ArrowRight className="w-4 h-4" /> חזור
      </Link>
      <div className="text-xs text-ink-muted flex-1 text-center px-2 truncate">{vibe}</div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
        >
          <Pencil className="w-3 h-3" /> ערוך
        </Link>
        <UserAvatar size={32} />
      </div>
    </div>
  );
}
