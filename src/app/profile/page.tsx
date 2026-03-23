"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingMutedLink } from "@/lib/clubing-ui";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [syncing, setSyncing] = useState(false);

  const handleSyncProfile = async () => {
    setSyncing(true);
    try {
      const r = await fetch("/api/user/sync-google-profile", { method: "POST" });
      if (r.ok) {
        window.location.reload();
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ClubingPageShell contentClassName="px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <ClubingHeading size="lg">{t("profile.title")}</ClubingHeading>
        <Link href="/results" className={`text-sm ${clubingMutedLink}`}>
          {t("profile.back")}
        </Link>
      </div>

      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#d4af37]/40 bg-zinc-950/60 text-4xl shadow-[0_0_32px_rgba(212,175,55,0.15)] backdrop-blur-sm">
          {user?.profilePhotoUrl ? (
            <img
              src={user.profilePhotoUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>👤</span>
          )}
        </div>
        {!user?.isGuest && !user?.isDeveloper && !user?.profilePhotoUrl && (
          <button
            type="button"
            onClick={handleSyncProfile}
            disabled={syncing}
            className="mt-2 text-sm text-[#d4af37]/85 transition hover:text-[#f0d78c] disabled:opacity-50"
          >
            {syncing ? t("profile.syncing") : t("profile.syncPhoto")}
          </button>
        )}
        <h2 className="mt-2 bg-gradient-to-b from-[#f5e6a8] via-[#d4af37] to-[#9a7320] bg-clip-text font-semibold text-transparent">
          {user?.name || t("profile.user")}
        </h2>
        {user?.isGuest && <span className="text-sm text-zinc-500">{t("profile.guest")}</span>}
        {user?.isDeveloper && <span className="text-sm text-amber-500/90">{t("profile.developer")}</span>}
        {!user?.isGuest && (user?.firstName || user?.lastName || user?.email) && (
          <div className="mt-4 w-full max-w-sm space-y-2 text-start">
            {user.firstName && (
              <p className="text-sm text-zinc-300">
                <span className="text-zinc-500">{t("profile.firstName")}</span> {user.firstName}
              </p>
            )}
            {user.lastName && (
              <p className="text-sm text-zinc-300">
                <span className="text-zinc-500">{t("profile.lastName")}</span> {user.lastName}
              </p>
            )}
            {user.email && (
              <p className="text-sm text-zinc-300">
                <span className="text-zinc-500">{t("profile.email")}</span> {user.email}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Link
          href="/results"
          className={`block rounded-2xl border border-[#d4af37]/35 bg-zinc-950/45 p-4 font-medium text-[#e8c96b] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition hover:border-[#d4af37]/65 hover:shadow-[0_0_24px_rgba(212,175,55,0.12)]`}
        >
          {t("profile.favorites")}
        </Link>
        <Link
          href="/create"
          className={`block rounded-2xl border border-[#d4af37]/35 bg-zinc-950/45 p-4 font-medium text-[#e8c96b] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition hover:border-[#d4af37]/65 hover:shadow-[0_0_24px_rgba(212,175,55,0.12)]`}
        >
          {t("profile.created")}
        </Link>
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-8 w-full rounded-xl border border-[#d4af37]/40 py-3 text-[#d4af37]/90 transition hover:border-[#d4af37] hover:text-[#f0d78c]"
      >
        {t("profile.logout")}
      </button>
    </ClubingPageShell>
  );
}
