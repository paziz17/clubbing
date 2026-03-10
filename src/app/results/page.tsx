"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface Event {
  id: string;
  name: string;
  date: string;
  time?: string;
  location: string;
  address?: string;
  imageUrl?: string;
  ticketLink?: string;
  tags: string[];
  ageRestriction?: string;
}

const REGIONS = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן", "נהריה", "נתניה", "באר שבע"];
const CATEGORIES = ["מוזיקה", "בר", "מסיבה", "פסטיבל", "הופעה"];
const DATES = ["היום", "מחר", "השבוע", "בחר תאריך..."];
const FORMATS = ["מסיבה", "פסטיבל", "הופעה", "בר"];

function ResultsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterRegion, setFilterRegion] = useState(searchParams.get("region") || "");
  const [filterCategory, setFilterCategory] = useState(searchParams.get("music") || searchParams.get("eventType") || "");

  const loadEvents = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    const params = new URLSearchParams();
    const region = searchParams.get("region") || filterRegion;
    const music = searchParams.get("music");
    const eventType = searchParams.get("eventType");
    const age = searchParams.get("age");
    if (region) params.set("region", region);
    if (music) params.set("music", music);
    if (eventType) params.set("eventType", eventType);
    if (age) params.set("age", age);

    try {
      if (refresh) {
        await fetch("/api/events/refresh", { method: "POST" });
      }
      const r = await fetch(`/api/events?${params}`, { cache: "no-store" });
      const data = await r.json();
      setEvents(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchParams, filterRegion]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filterRegion) params.set("region", filterRegion);
    if (filterCategory) params.set("eventType", filterCategory);
    window.location.href = `/results?${params.toString()}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("he-IL", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string, time?: string) => {
    if (time) return time;
    const d = new Date(dateStr);
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header showAuth />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin w-12 h-12 border-2 border-[#f05537] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showAuth />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="font-heading text-2xl sm:text-3xl text-gray-900 mb-6">
          אירועי מסיבות ורייבס בישראל
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar - Eventbrite style */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">סינון</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תאריך</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:ring-[#f05537] focus:border-[#f05537]">
                    {DATES.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אזור</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:ring-[#f05537] focus:border-[#f05537]"
                  >
                    <option value="">כל האזורים</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:ring-[#f05537] focus:border-[#f05537]"
                  >
                    <option value="">הכל</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">פורמט</label>
                  <div className="space-y-2">
                    {FORMATS.map((f) => (
                      <label key={f} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-[#f05537] focus:ring-[#f05537]" />
                        <span className="text-sm text-gray-700">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={applyFilters}
                  className="w-full py-2 bg-[#f05537] hover:bg-[#e04a2d] text-white text-sm font-medium rounded-md transition"
                >
                  החל סינון
                </button>
              </div>
            </div>
          </aside>

          {/* Event list - Eventbrite style */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600 text-sm">
                {events.length} אירועים
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadEvents(true)}
                  disabled={refreshing}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 text-sm"
                >
                  {refreshing ? "מרענן..." : "רענן"}
                </button>
                <Link
                  href="/interests"
                  className="px-4 py-2 bg-[#f05537] hover:bg-[#e04a2d] text-white rounded-md text-sm font-medium transition"
                >
                  שנה סינון
                </Link>
              </div>
            </div>

            <section className="space-y-4">
              {events.map((e) => (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="event-card block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-48 h-40 sm:h-auto shrink-0 bg-gray-100">
                      {e.imageUrl ? (
                        <img src={e.imageUrl} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100">
                          🎉
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="text-gray-900 font-semibold text-lg mb-1 line-clamp-2">
                          {e.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {formatDate(e.date)} · {formatTime(e.date, e.time)}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {e.address || e.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[#f05537] text-sm font-medium">
                          פרטים ←
                        </span>
                        {e.ticketLink && !e.ticketLink.includes("example.com") && (
                          <span className="text-green-600 text-xs font-medium">כרטיסים זמינים</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </section>

            {events.length === 0 && (
              <div className="text-center py-24 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600 text-lg mb-4">לא נמצאו אירועים</p>
                <Link
                  href="/interests"
                  className="inline-block px-6 py-3 bg-[#f05537] hover:bg-[#e04a2d] text-white rounded-md font-medium transition"
                >
                  שנה סינון
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin w-12 h-12 border-2 border-[#f05537] border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
