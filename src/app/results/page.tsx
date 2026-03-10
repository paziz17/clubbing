"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

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

function ResultsContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showAuth />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuth />

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl text-white">
            {t("results.title")}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => loadEvents(true)}
              disabled={refreshing}
              className="px-4 py-2 bg-[#1a0f2e] border border-[#2d1b4e] text-violet-300 hover:border-violet-500/50 rounded-lg transition disabled:opacity-50 text-sm font-medium"
            >
              {refreshing ? t("results.refreshing") : t("results.refresh")}
            </button>
            <Link
              href="/interests"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition"
            >
              {t("results.changeFilter")}
            </Link>
          </div>
        </div>

        {/* Edmtrain-style event grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="event-card block bg-[#1a0f2e] border border-[#2d1b4e] rounded-xl overflow-hidden"
            >
              <div className="aspect-[4/3] bg-[#0f0a1a] relative overflow-hidden">
                {e.imageUrl ? (
                  <img
                    src={e.imageUrl}
                    alt={e.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-violet-900/30 to-purple-900/20">
                    🎉
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="inline-block px-2 py-1 bg-violet-600/90 text-white text-xs font-medium rounded">
                    {formatDate(e.date)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                  {e.name}
                </h3>
                <p className="text-violet-400 text-sm mb-3">
                  📍 {e.address || e.location}
                </p>
                {e.time && (
                  <p className="text-violet-500 text-sm mb-3">
                    🕐 {e.time}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-violet-400 text-sm font-medium">
                  {t("results.tickets")}
                  <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </section>

        {events.length === 0 && (
          <div className="text-center py-24">
            <p className="text-violet-400 text-lg mb-4">{t("results.noEvents")}</p>
            <Link
              href="/interests"
              className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition"
            >
              {t("results.changeFilter")}
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
