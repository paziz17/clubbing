"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#080810] px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-gradient-title">פרופיל</h1>
        <Link href="/results" className="text-[#ff2d6a] text-sm hover:text-[#ff6b35] transition">← חזרה</Link>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-[#0e0e16] border border-[#00d4ff]/40 flex items-center justify-center text-4xl mb-4 overflow-hidden">
          {user?.profilePhotoUrl ? (
            <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">👤</span>
          )}
        </div>
        <h2 className="text-white font-semibold">{user?.name || "משתמש"}</h2>
        {user?.isGuest && <span className="text-zinc-500 text-sm">אורח</span>}
      </div>

      <div className="space-y-4">
        <Link
          href="/results"
          className="block p-4 bg-[#0e0e16] border border-[#00d4ff]/40 rounded-xl text-white hover:border-[#00d4ff]/70 transition"
        >
          אירועים מועדפים
        </Link>
        <Link
          href="/create"
          className="block p-4 bg-[#0e0e16] border border-[#00d4ff]/40 rounded-xl text-white hover:border-[#00d4ff]/70 transition"
        >
          אירועים שיצרתי
        </Link>
      </div>

      <button
        onClick={logout}
        className="w-full mt-8 py-3 border border-[#ff2d6a]/50 text-zinc-400 rounded-xl hover:text-[#ff2d6a] hover:border-[#ff2d6a]/70 transition"
      >
        התנתק
      </button>
    </div>
  );
}
