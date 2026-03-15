"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-[#d4af37]">פרופיל</h1>
        <Link href="/results" className="text-[#d4af37] text-sm hover:text-[#f0d78c] transition">← חזרה</Link>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-[#111111] border border-[#d4af37]/40 flex items-center justify-center text-4xl mb-4 overflow-hidden">
          {user?.profilePhotoUrl ? (
            <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">👤</span>
          )}
        </div>
        <h2 className="text-[#d4af37] font-semibold">{user?.name || "משתמש"}</h2>
        {user?.isGuest && <span className="text-[#d4af37]/60 text-sm">אורח</span>}
        {!user?.isGuest && (user?.firstName || user?.lastName || user?.email) && (
          <div className="mt-4 w-full max-w-sm space-y-2 text-right">
            {user.firstName && (
              <p className="text-zinc-300 text-sm">
                <span className="text-zinc-500">שם פרטי:</span> {user.firstName}
              </p>
            )}
            {user.lastName && (
              <p className="text-zinc-300 text-sm">
                <span className="text-zinc-500">שם משפחה:</span> {user.lastName}
              </p>
            )}
            {user.email && (
              <p className="text-zinc-300 text-sm">
                <span className="text-zinc-500">אימייל:</span> {user.email}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Link
          href="/results"
          className="block p-4 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-[#d4af37] hover:border-[#d4af37]/70 transition"
        >
          אירועים מועדפים
        </Link>
        <Link
          href="/create"
          className="block p-4 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-[#d4af37] hover:border-[#d4af37]/70 transition"
        >
          אירועים שיצרתי
        </Link>
      </div>

      <button
        onClick={logout}
        className="w-full mt-8 py-3 border border-[#d4af37]/50 text-[#d4af37]/70 rounded-xl hover:text-[#d4af37] hover:border-[#d4af37]/70 transition"
      >
        התנתק
      </button>
    </div>
  );
}
