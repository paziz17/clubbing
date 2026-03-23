"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserIcon } from "@/components/SocialIcons";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ClubingLogoIcon } from "@/components/ClubingLogoIcon";

export function LogoHeader() {
  const { status } = useSession();
  const { user } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const isResultsPage = pathname === "/results";
  /** פרופיל בכל עמוד לאחר התחברות (NextAuth) — תמונה/אייקון מ־useAuth + סשן */
  const showProfileLink = status === "authenticated";

  const handleRefresh = async () => {
    if (!isResultsPage || refreshing) return;
    setRefreshing(true);
    try {
      await fetch("/api/events/refresh", { method: "POST" });
      window.dispatchEvent(new CustomEvent("clubing-refresh-events"));
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 overflow-visible border-b border-[#d4af37]/25 bg-black/80 shadow-[0_4px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="relative flex justify-between items-center min-h-14 h-auto sm:h-14 py-2 sm:py-0 px-3 sm:px-4 gap-2 overflow-visible">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isResultsPage && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-full border border-[#d4af37]/35 bg-zinc-950/70 px-3 py-1.5 text-sm font-medium text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-[#d4af37]/70 hover:text-white disabled:opacity-50"
            >
              {refreshing ? (
                <span className="w-4 h-4 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {refreshing ? t("header.refreshing") : t("header.refresh")}
            </button>
          )}
          <LanguageSwitcher />
          {showProfileLink && (
            <Link
              href="/profile"
              className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              title={t("header.profile")}
              aria-label={t("header.profile")}
            >
              {user?.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt=""
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/15 hover:border-[#d4af37]/50 transition"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-full border border-white/15 bg-zinc-800 text-zinc-400">
                  <UserIcon className="w-5 h-5" />
                </span>
              )}
            </Link>
          )}
        </div>
        <Link
          href="/"
          dir="ltr"
          className="absolute left-1/2 flex max-w-[min(92vw,420px)] -translate-x-1/2 flex-row items-center justify-center gap-2 transition hover:opacity-90 sm:max-w-none sm:gap-2.5"
        >
          <ClubingLogoIcon className="h-[1.05em] min-h-[1.85rem] w-[1.05em] min-w-[1.85rem] shrink-0 animate-[spin_2.4s_linear_infinite] drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] sm:h-[1.1em] sm:min-h-9 sm:w-[1.1em] sm:min-w-9" />
          <span className="truncate bg-gradient-to-b from-[#f5e6a8] via-[#d4af37] to-[#9a7320] bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-xl">
            CLUBING
          </span>
        </Link>
        <div className="w-12 sm:w-24 shrink-0" />
      </div>
    </header>
  );
}
