"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showAuth />

      <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center text-4xl mb-4 overflow-hidden bg-white">
            {user?.profilePhotoUrl ? (
              <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <h2 className="text-gray-900 font-semibold text-lg">{user?.name || "משתמש"}</h2>
          {user?.isGuest && <span className="text-gray-500 text-xs mt-1">אורח</span>}
        </div>

        <div className="space-y-4">
          <Link
            href="/results"
            className="block p-5 bg-white border border-gray-200 rounded-md text-gray-700 hover:border-[#f05537] hover:text-[#f05537] transition"
          >
            אירועים
          </Link>
          <Link
            href="/create"
            className="block p-5 bg-white border border-gray-200 rounded-md text-gray-700 hover:border-[#f05537] hover:text-[#f05537] transition"
          >
            צור אירוע
          </Link>
        </div>

        <button
          onClick={logout}
          className="w-full mt-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-md hover:border-[#f05537] hover:text-[#f05537] transition font-medium"
        >
          התנתק
        </button>
      </main>

      <Footer />
    </div>
  );
}
