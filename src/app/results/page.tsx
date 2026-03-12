"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1571266028243-d220e8c3c9e2?w=400&h=300&fit=crop";

interface Event {
  id: string;
  name: string;
  date: string;
  time?: string;
  location: string;
  imageUrl?: string;
  tags: string[];
  ageRestriction?: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    const params = new URLSearchParams();
    const region = searchParams.get("region");
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
  }, [searchParams]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const onRefresh = () => loadEvents(true);
    window.addEventListener("clubbing-refresh-events", onRefresh);
    return () => window.removeEventListener("clubbing-refresh-events", onRefresh);
  }, [loadEvents]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d12]">
        <div className="animate-spin w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d12] px-4 py-6">
      <div className="flex flex-col items-center mb-6 gap-4">
        <h1 className="text-xl font-bold text-white">תוצאות לפי התאמה</h1>
        <Link href="/interests" className="px-4 py-2 text-rose-500 text-sm border border-rose-500/50 rounded-lg hover:bg-rose-500/10">
          שנה סינון
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((e) => (
          <Link key={e.id} href={`/events/${e.id}`}>
            <div className="bg-[#16161d] border border-zinc-800 rounded-2xl overflow-hidden flex gap-4">
              <div className="w-28 h-28 min-w-[7rem] bg-zinc-800 relative shrink-0 rounded-2xl overflow-hidden">
                <img
                  src={e.imageUrl || DEFAULT_EVENT_IMAGE}
                  alt={e.name}
                  className="w-full h-full object-cover"
                  onError={(ev) => {
                    (ev.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
                  }}
                />
              </div>
              <div className="p-4 flex-1 min-w-0">
                <h3 className="text-white font-semibold">{e.name}</h3>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {e.tags.slice(0, 3).map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-zinc-500 text-sm mt-2">
                  {new Date(e.date).toLocaleDateString("he-IL")} • {e.time} • {e.location}
                </p>
                <p className="text-rose-500 text-xs mt-1">לפרטים נוספים ←</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {events.length === 0 && (
        <p className="text-center text-zinc-500 py-12">לא נמצאו אירועים</p>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0d0d12]"><div className="animate-spin w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
