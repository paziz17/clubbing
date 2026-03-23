"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminCalendar } from "@/components/AdminCalendar";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingGlassPanel, clubingListRow, clubingMutedLink } from "@/lib/clubing-ui";

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
  venueId?: string | null;
  reservationsCount: number;
  totalPeople: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/admin/login");
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

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const totalReservations = events.reduce((s, e) => s + e.reservationsCount, 0);
  const totalPeople = events.reduce((s, e) => s + e.totalPeople, 0);
  const totalVenues = new Set(events.map((e) => e.venueId).filter(Boolean)).size;
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [recentReservations, setRecentReservations] = useState<
    { id: string; phone: string; email: string; numPeople: number; createdAt: string; event: { id: string; name: string } }[]
  >([]);

  useEffect(() => {
    fetch("/api/admin/reservations")
      .then((r) => r.status === 401 ? null : r.json())
      .then((data) => data && setRecentReservations(data));
  }, []);

  if (loading) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </ClubingPageShell>
    );
  }

  if (error) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen items-center justify-center px-6">
        <p className="text-[#e8c96b]">{error}</p>
      </ClubingPageShell>
    );
  }

  return (
    <ClubingPageShell contentClassName="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <ClubingHeading size="lg">CRM – ניהול מועדונים</ClubingHeading>
          <button type="button" onClick={handleLogout} className={`text-sm ${clubingMutedLink}`}>
            התנתק
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={`p-6 ${clubingGlassPanel}`}>
            <p className="mb-1 text-sm text-zinc-500">סה״כ הזמנות</p>
            <p className="text-3xl font-bold text-white">{totalReservations}</p>
          </div>
          <div className={`p-6 ${clubingGlassPanel}`}>
            <p className="mb-1 text-sm text-zinc-500">סה״כ אנשים</p>
            <p className="text-3xl font-bold text-white">{totalPeople}</p>
          </div>
          <div className={`p-6 ${clubingGlassPanel}`}>
            <p className="mb-1 text-sm text-zinc-500">סה״כ מועדונים</p>
            <p className="text-3xl font-bold text-white">{totalVenues}</p>
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
            <h2 className="mb-4 text-lg font-semibold text-gradient-gold">הזמנות אחרונות</h2>
            <div className={`overflow-hidden ${clubingGlassPanel}`}>
              <div className="max-h-48 divide-y divide-[#d4af37]/20 overflow-y-auto">
                {recentReservations.slice(0, 10).map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/events/${r.event.id}`}
                    className="block px-4 py-3 hover:bg-[#d4af37]/10 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">{r.event.name}</p>
                        <p className="text-zinc-500 text-xs">
                          {r.numPeople} אנשים • {r.phone} • {new Date(r.createdAt).toLocaleString("he-IL")}
                        </p>
                      </div>
                      <span className="text-[#d4af37] text-sm">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <h2 className="mb-4 text-lg font-semibold text-gradient-gold">כל המועדונים והאירועים</h2>
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">אין אירועים במערכת</p>
          ) : (
            events.map((e) => (
              <Link
                key={e.id}
                href={`/admin/events/${e.id}`}
                className={`block p-4 ${clubingListRow}`}
              >
                <div className="flex gap-4 items-center">
                  {e.imageUrl && (
                    <img
                      src={e.imageUrl}
                      alt={e.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{e.name}</p>
                    <p className="text-zinc-500 text-sm">
                      {new Date(e.date).toLocaleDateString("he-IL")} • {e.location}
                      {e.address && ` • ${e.address}`}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-[#d4af37] font-semibold">{e.reservationsCount} הזמנות</p>
                    <p className="text-zinc-400 text-sm">{e.totalPeople} אנשים</p>
                  </div>
                  <span className="text-zinc-500">→</span>
                </div>
              </Link>
            ))
          )}
        </div>

        <Link href="/results" className={`mt-8 block text-center text-sm ${clubingMutedLink}`}>
          ← חזרה לאתר
        </Link>
      </div>
    </ClubingPageShell>
  );
}
