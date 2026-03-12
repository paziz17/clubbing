"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserIcon } from "@/components/SocialIcons";

export function LogoHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const isResultsPage = pathname === "/results";

  const handleRefresh = async () => {
    if (!isResultsPage || refreshing) return;
    setRefreshing(true);
    try {
      await fetch("/api/events/refresh", { method: "POST" });
      window.dispatchEvent(new CustomEvent("clubbing-refresh-events"));
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d12] border-b border-zinc-800">
      <div className="relative flex justify-between items-center h-14 px-4">
        <div className="flex items-center gap-3 shrink-0">
          {isResultsPage && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition disabled:opacity-50 text-sm font-medium"
            >
              {refreshing ? (
                <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {refreshing ? "מרענן..." : "רענן"}
            </button>
          )}
          <Link href="/profile" className="text-zinc-400 text-sm shrink-0 flex items-center gap-1.5 hover:text-white transition">
            <UserIcon className="w-4 h-4" />
            פרופיל
          </Link>
        </div>
        <Link
          href="/results"
          className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-white tracking-tight hover:text-rose-500 transition"
        >
          CLUBBING
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/venue/login" className="text-zinc-500 text-xs hover:text-zinc-400 transition">
            בעל מועדון?
          </Link>
          <Link href="/create" className="text-rose-500 text-sm shrink-0">Be The Party</Link>
        </div>
      </div>
    </header>
  );
}
