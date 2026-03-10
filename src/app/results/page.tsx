"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-12 h-12 border-2 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a] bg-black/90 backdrop-blur-sm">
        <Link href="/" className="font-heading text-xl text-white tracking-widest">CLUBBING</Link>
        <div className="flex items-center gap-6">
          <Link href="/create" className="text-zinc-400 text-sm tracking-widest uppercase hover:text-white transition">Be The Party</Link>
          <Link href="/profile" className="text-zinc-400 text-sm tracking-widest uppercase hover:text-white transition">פרופיל</Link>
        </div>
      </header>

      <main className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl text-white">
            אירועים
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => loadEvents(true)}
              disabled={refreshing}
              className="px-4 py-2 border border-[#1a1a1a] text-zinc-400 hover:text-white hover:border-white/30 transition disabled:opacity-50 text-sm tracking-widest uppercase"
            >
              {refreshing ? "מרענן..." : "רענן"}
            </button>
            <Link
              href="/interests"
              className="px-4 py-2 border border-white text-white hover:bg-white hover:text-black transition text-sm tracking-widest uppercase"
            >
              שנה סינון
            </Link>
          </div>
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className="group">
              <article className="border border-[#1a1a1a] overflow-hidden hover:border-white/30 transition">
                <div className="aspect-[4/3] bg-[#0a0a0a] relative overflow-hidden">
                  {e.imageUrl ? (
                    <img
                      src={e.imageUrl}
                      alt={e.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎉</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="p-5 border-t border-[#1a1a1a]">
                  <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-white">{e.name}</h3>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {e.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-zinc-500 text-xs uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-zinc-500 text-sm">
                    {new Date(e.date).toLocaleDateString("he-IL")} • {e.time} • {e.location}
                  </p>
                  <p className="text-white text-sm mt-3 tracking-widest uppercase group-hover:underline">
                    לפרטים ←
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </section>

        {events.length === 0 && (
          <div className="text-center py-24">
            <p className="text-zinc-500 text-lg">לא נמצאו אירועים</p>
            <Link href="/interests" className="inline-block mt-4 text-white border border-white px-6 py-3 tracking-widest uppercase hover:bg-white hover:text-black transition">
              שנה סינון
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><div className="animate-spin w-12 h-12 border-2 border-white border-t-transparent" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
