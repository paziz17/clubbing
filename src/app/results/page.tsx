"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1764510376258-2c9978ec3e4e?w=400&h=300&fit=crop";

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
      const text = await r.text();
      const data = text ? (JSON.parse(text) as Event[]) : [];
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
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
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <div className="animate-spin w-12 h-12 border-2 border-[#00d4ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] px-4 py-6">
      <div className="flex flex-col items-center mb-6 gap-4">
        <h1 className="text-xl font-bold text-gradient-title">תוצאות לפי התאמה</h1>
        <Link href="/interests" className="px-5 py-2.5 text-[#00d4ff] text-sm border border-[#00d4ff]/60 rounded-full hover:bg-[#00d4ff]/10 hover:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition">
          שנה סינון
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((e) => (
          <Link key={e.id} href={`/events/${e.id}`}>
            <div className="bg-[#0e0e16] border border-[#ff2d6a]/30 rounded-2xl overflow-hidden flex gap-4 hover:border-[#ff2d6a]/60 hover:shadow-[0_0_20px_rgba(255,45,106,0.15)] transition">
              <div className="w-28 h-28 min-w-[7rem] bg-zinc-900 relative shrink-0 rounded-2xl overflow-hidden">
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
                    <span key={t} className="px-2 py-0.5 bg-[#ff2d6a]/20 border border-[#ff2d6a]/40 rounded text-xs text-zinc-300">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-zinc-500 text-sm mt-2">
                  {new Date(e.date).toLocaleDateString("he-IL")} • {e.time} • {e.location}
                </p>
                <p className="text-[#ff2d6a] text-xs mt-1">לפרטים נוספים ←</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#080810]"><div className="animate-spin w-12 h-12 border-2 border-[#00d4ff] border-t-transparent rounded-full" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
