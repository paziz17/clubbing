"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminCalendar } from "@/components/AdminCalendar";

interface EventItem {
  id: string;
  name: string;
  date: string;
  time: string | null;
  location: string;
  address: string | null;
  phone: string | null;
  imageUrl: string | null;
  status: string;
  reservationsCount: number;
  totalPeople: number;
}

export default function VenuePage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentReservations, setRecentReservations] = useState<
    { id: string; phone: string; email: string; numPeople: number; createdAt: string; event: { id: string; name: string } }[]
  >([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    fetch("/api/venue/events")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/venue/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setEvents(data);
      })
      .catch(() => setError("שגיאה בטעינת הנתונים"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetch("/api/venue/reservations")
      .then((r) => r.status === 401 ? null : r.json())
      .then((data) => data && setRecentReservations(data));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/venue/logout", { method: "POST" });
    router.replace("/venue/login");
  };

  const totalReservations = events.reduce((s, e) => s + e.reservationsCount, 0);
  const totalPeople = events.reduce((s, e) => s + e.totalPeople, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center px-6">
        <p className="text-rose-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d12] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">CRM המועדון שלי</h1>
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
            <p className="text-3xl font-bold text-white">{totalReservations}</p>
          </div>
          <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-1">סה״כ אנשים</p>
            <p className="text-3xl font-bold text-white">{totalPeople}</p>
          </div>
        </div>

        <div className="mb-8">
          <AdminCalendar
            events={events}
            currentMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
          />
        </div>

        {recentReservations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">הזמנות אחרונות</h2>
            <div className="bg-[#16161d] border border-zinc-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-zinc-800 max-h-48 overflow-y-auto">
                {recentReservations.slice(0, 10).map((r) => (
                  <Link
                    key={r.id}
                    href={`/venue/events/${r.event.id}`}
                    className="block px-4 py-3 hover:bg-zinc-800/50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">{r.event.name}</p>
                        <p className="text-zinc-500 text-xs">
                          {r.numPeople} אנשים • {r.phone} • {new Date(r.createdAt).toLocaleString("he-IL")}
                        </p>
                      </div>
                      <span className="text-rose-500 text-sm">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-white mb-4">האירועים שלי</h2>
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">אין אירועים במערכת</p>
          ) : (
            events.map((e) => (
              <Link
                key={e.id}
                href={`/venue/events/${e.id}`}
                className="block bg-[#16161d] border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition"
              >
                <div className="flex gap-4 items-center">
                  {e.imageUrl && (
                    <img src={e.imageUrl} alt={e.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{e.name}</p>
                    <p className="text-zinc-500 text-sm">
                      {new Date(e.date).toLocaleDateString("he-IL")} • {e.location}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-rose-500 font-semibold">{e.reservationsCount} הזמנות</p>
                    <p className="text-zinc-400 text-sm">{e.totalPeople} אנשים</p>
                  </div>
                  <span className="text-zinc-500">→</span>
                </div>
              </Link>
            ))
          )}
        </div>

        <Link href="/results" className="block text-center text-zinc-500 text-sm mt-8 hover:text-white transition">
          ← חזרה לאתר
        </Link>
      </div>
    </div>
  );
}
