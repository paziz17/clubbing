"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0d0d12] px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-white">פרופיל</h1>
        <Link href="/results" className="text-rose-500 text-sm">← חזרה</Link>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-4xl mb-4 overflow-hidden">
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
          className="block p-4 bg-[#16161d] border border-zinc-800 rounded-xl text-white"
        >
          אירועים מועדפים
        </Link>
        <Link
          href="/create"
          className="block p-4 bg-[#16161d] border border-zinc-800 rounded-xl text-white"
        >
          אירועים שיצרתי
        </Link>
      </div>

      <button
        onClick={logout}
        className="w-full mt-8 py-3 border border-zinc-700 text-zinc-400 rounded-xl hover:text-white"
      >
        התנתק
      </button>
    </div>
  );
}
