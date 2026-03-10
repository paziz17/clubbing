"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuth />

      <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 rounded-xl border border-[#2d1b4e] flex items-center justify-center text-4xl mb-4 overflow-hidden bg-[#1a0f2e]">
            {user?.profilePhotoUrl ? (
              <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <h2 className="text-white font-semibold text-lg">{user?.name || (t("nav.profile") === "Profile" ? "User" : "משתמש")}</h2>
          {user?.isGuest && <span className="text-violet-500 text-xs mt-1">{t("auth.guest").includes("guest") ? "Guest" : "אורח"}</span>}
        </div>

        <div className="space-y-4">
          <Link
            href="/results"
            className="block p-5 bg-[#1a0f2e] border border-[#2d1b4e] rounded-xl text-white hover:border-violet-500/50 transition"
          >
            {t("results.title")}
          </Link>
          <Link
            href="/create"
            className="block p-5 bg-[#1a0f2e] border border-[#2d1b4e] rounded-xl text-white hover:border-violet-500/50 transition"
          >
            Add Event
          </Link>
        </div>

        <button
          onClick={logout}
          className="w-full mt-8 py-4 bg-[#1a0f2e] border border-[#2d1b4e] text-violet-400 rounded-xl hover:border-violet-500/50 hover:text-white transition font-medium"
        >
          {t("nav.logout")}
        </button>
      </main>

      <Footer />
    </div>
  );
}
