"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserIcon } from "@/components/SocialIcons";
import { useAuth } from "@/context/AuthContext";

export function LogoHeader() {
  const { user, logout } = useAuth();
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
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#d4af37]/20">
      <div className="relative flex justify-between items-center h-14 px-4">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isResultsPage && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111111] border border-[#d4af37]/40 text-zinc-300 hover:border-[#d4af37]/70 hover:text-white transition disabled:opacity-50 text-sm font-medium"
            >
              {refreshing ? (
                <span className="w-4 h-4 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {refreshing ? "מרענן..." : "רענן"}
            </button>
          )}
          <Link href="/profile" className="text-zinc-400 text-sm shrink-0 flex items-center gap-1.5 hover:text-[#d4af37] transition">
            {user?.profilePhotoUrl ? (
              <img
                src={user.profilePhotoUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/40"
              />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
            פרופיל
          </Link>
          {user ? (
            <button
              onClick={() => {
                logout();
                router.push("/auth");
                router.refresh();
              }}
              className="text-zinc-500 text-xs hover:text-[#d4af37] transition whitespace-nowrap"
            >
              התנתק
            </button>
          ) : (
            <Link href="/auth" className="text-zinc-500 text-xs hover:text-[#d4af37] transition whitespace-nowrap">
              התחבר
            </Link>
          )}
          <Link href="/venue/login" className="text-zinc-500 text-xs hover:text-[#d4af37] transition whitespace-nowrap">
            בעל מועדון?
          </Link>
        </div>
        <Link
          href="/results"
          className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-[#d4af37] tracking-tight hover:opacity-90 transition"
        >
          CLUBBING
        </Link>
        <div className="w-24 shrink-0" />
      </div>
    </header>
  );
}
