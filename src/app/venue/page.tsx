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
          <ClubingHeading size="lg">CRM המועדון שלי</ClubingHeading>
          <button type="button" onClick={handleLogout} className={`text-sm ${clubingMutedLink}`}>
            התנתק
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className={`p-6 ${clubingGlassPanel}`}>
            <p className="mb-1 text-sm text-zinc-500">סה״כ הזמנות</p>
            <p className="text-3xl font-bold text-white">{totalReservations}</p>
          </div>
          <div className={`p-6 ${clubingGlassPanel}`}>
            <p className="mb-1 text-sm text-zinc-500">סה״כ אנשים</p>
            <p className="text-3xl font-bold text-white">{totalPeople}</p>
          </div>
        </div>

        <div className="mb-8">
          <AdminCalendar
            events={events}
            currentMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
            eventsHrefPrefix="/venue/events"
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
                    href={`/venue/events/${r.event.id}`}
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

        <h2 className="mb-4 text-lg font-semibold text-gradient-gold">האירועים שלי</h2>
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">אין אירועים במערכת</p>
          ) : (
            events.map((e) => (
              <Link
                key={e.id}
                href={`/venue/events/${e.id}`}
                className={`block p-4 ${clubingListRow}`}
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
