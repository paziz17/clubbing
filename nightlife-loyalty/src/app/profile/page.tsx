"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const [wallet, setWallet] = useState<Record<string, { balance: number; expiringSoon?: number }>>({});
  const [clubs, setClubs] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.clubs || [];
        setClubs(list);
        return list;
      })
      .then((list) => {
        list.forEach((c: { id: string }) => {
          fetch(`/api/wallet?club_id=${c.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((w) =>
              setWallet((prev) => ({
                ...prev,
                [c.id]: { balance: w.balance || 0, expiringSoon: w.expiringSoon || 0 },
              }))
            );
        });
      });
  }, [token]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/auth" className="text-rose-500">
          התחבר
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-zinc-800/50 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-rose-500 hover:text-rose-400">
          ← חזרה
        </Link>
        <button onClick={logout} className="text-zinc-500 hover:text-rose-400 text-sm">
          התנתק
        </button>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">{user.name}</h1>
        <p className="text-zinc-500 mb-8">{user.phone}</p>

        <h2 className="text-lg font-semibold text-white mb-4">ארנק</h2>
        <div className="space-y-3 mb-8">
          {clubs.map((c) => (
            <div
              key={c.id}
              className="bg-[#14141f] border border-zinc-800 rounded-xl p-4 flex justify-between items-center"
            >
              <span className="text-white">{c.name}</span>
              <div className="text-left">
                <span className="text-rose-400 font-bold">
                  {wallet[c.id]?.balance ?? 0} קרדיטים
                </span>
                {wallet[c.id]?.expiringSoon ? (
                  <p className="text-amber-400 text-xs mt-1">
                    {wallet[c.id].expiringSoon} יפוגו בקרוב
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/wallet"
          className="block py-3 text-center border border-zinc-700 rounded-xl text-zinc-300 hover:text-white"
        >
          היסטוריית תנועות
        </Link>
      </main>
    </div>
  );
}
