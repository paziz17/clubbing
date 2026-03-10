"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black px-6 py-8">
      <header className="flex justify-between items-center mb-12">
        <Link href="/" className="font-heading text-xl text-white tracking-widest">CLUBBING</Link>
        <Link href="/results" className="text-zinc-500 text-sm tracking-widest uppercase hover:text-white transition">← חזרה</Link>
      </header>

      <div className="flex flex-col items-center mb-12">
        <div className="w-24 h-24 border border-[#1a1a1a] flex items-center justify-center text-4xl mb-4 overflow-hidden bg-[#0a0a0a]">
          {user?.profilePhotoUrl ? (
            <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">👤</span>
          )}
        </div>
        <h2 className="text-white font-semibold text-lg">{user?.name || "משתמש"}</h2>
        {user?.isGuest && <span className="text-zinc-500 text-xs uppercase tracking-widest mt-1">אורח</span>}
      </div>

      <div className="space-y-4 max-w-md">
        <Link
          href="/results"
          className="block p-5 border border-[#1a1a1a] text-white hover:border-white/30 transition"
        >
          אירועים מועדפים
        </Link>
        <Link
          href="/create"
          className="block p-5 border border-[#1a1a1a] text-white hover:border-white/30 transition"
        >
          אירועים שיצרתי
        </Link>
      </div>

      <button
        onClick={logout}
        className="w-full max-w-md mt-8 py-4 border border-[#1a1a1a] text-zinc-400 hover:text-white hover:border-white/30 transition tracking-widest uppercase"
      >
        התנתק
      </button>
    </div>
  );
}
