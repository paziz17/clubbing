"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Stats {
  totalReservations: number;
  totalPeople: number;
  totalEvents: number;
  byEvent: {
    eventId: string;
    eventName: string;
    eventDate: string;
    reservations: number;
    totalPeople: number;
  }[];
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => setError("שגיאה בטעינת הנתונים"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center px-6">
        <p className="text-rose-500">{error || "טוען..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d12] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">CRM – ניהול הזמנות</h1>
          <button
            onClick={handleLogout}
            className="text-zinc-500 text-sm hover:text-white transition"
          >
            התנתק
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-1">סה״כ הזמנות</p>
            <p className="text-3xl font-bold text-white">{stats.totalReservations}</p>
          </div>
          <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-1">סה״כ אנשים</p>
            <p className="text-3xl font-bold text-white">{stats.totalPeople}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-4">הזמנות לפי אירוע</h2>
        <div className="space-y-3">
          {stats.byEvent.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">אין הזמנות עדיין</p>
          ) : (
            stats.byEvent.map((e) => (
              <div
                key={e.eventId}
                className="bg-[#16161d] border border-zinc-800 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-medium">{e.eventName}</p>
                  <p className="text-zinc-500 text-sm">
                    {new Date(e.eventDate).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-rose-500 font-semibold">{e.reservations} הזמנות</p>
                  <p className="text-zinc-400 text-sm">{e.totalPeople} אנשים</p>
                </div>
              </div>
            ))
          )}
        </div>

        <Link
          href="/results"
          className="block text-center text-zinc-500 text-sm mt-8 hover:text-white transition"
        >
          ← חזרה לאתר
        </Link>
      </div>
    </div>
  );
}
