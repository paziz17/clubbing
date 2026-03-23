"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/i18n/locales";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingMutedLink } from "@/lib/clubing-ui";
import { POST_AUTH_REDIRECT_KEY } from "@/lib/post-auth-redirect";

const resultsEventCard =
  "rounded-3xl border border-[#d4af37]/32 bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-black/95 shadow-[0_10px_44px_rgba(0,0,0,0.52),0_0_0_1px_rgba(212,175,55,0.07),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md ring-1 ring-white/[0.05] transition duration-300 group-hover:border-[#d4af37]/52 group-hover:shadow-[0_14px_52px_rgba(0,0,0,0.58),0_0_42px_rgba(212,175,55,0.14),inset_0_1px_0_rgba(255,255,255,0.1)] group-hover:ring-[#d4af37]/12";

function dateLocaleTag(locale: Locale): string {
  const m: Record<Locale, string> = {
    he: "he-IL",
    en: "en-US",
    es: "es-ES",
    ru: "ru-RU",
    fr: "fr-FR",
  };
  return m[locale];
}

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
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(
    async (refresh = false) => {
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
      }
    },
    [searchParams],
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    try {
      sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onRefresh = () => loadEvents(true);
    window.addEventListener("clubing-refresh-events", onRefresh);
    return () => window.removeEventListener("clubing-refresh-events", onRefresh);
  }, [loadEvents]);

  if (loading) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </ClubingPageShell>
    );
  }

  return (
    <ClubingPageShell contentClassName="px-4 py-6 sm:px-5">
      <div className="mb-8 flex flex-col items-center gap-4">
        <ClubingHeading size="lg" className="text-center">
          {t("results.title")}
        </ClubingHeading>
        <Link
          href="/interests"
          className={`rounded-full border border-[#d4af37]/45 bg-zinc-950/50 px-5 py-2.5 text-sm font-medium text-[#e8c96b] shadow-[0_0_20px_rgba(212,175,55,0.12)] backdrop-blur-sm transition hover:border-[#d4af37] hover:shadow-[0_0_28px_rgba(212,175,55,0.2)]`}
        >
          {t("results.changeFilter")}
        </Link>
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-6 sm:gap-8">
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/events/${e.id}`}
            className="group block w-full rounded-3xl outline-none transition active:scale-[0.992] focus-visible:ring-2 focus-visible:ring-[#d4af37]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <div className={`flex items-center gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 ${resultsEventCard}`}>
              <div className="relative h-[7.25rem] w-[7.25rem] shrink-0 overflow-hidden rounded-2xl bg-zinc-900/50 transition duration-300 sm:h-32 sm:w-32">
                <img
                  src={e.imageUrl || DEFAULT_EVENT_IMAGE}
                  alt={e.name}
                  className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                  onError={(ev) => {
                    (ev.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
                  }}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 text-start sm:gap-2.5">
                <h3 className="line-clamp-2 bg-gradient-to-b from-[#f8ecc4] via-[#d4af37] to-[#a07820] bg-clip-text text-base font-semibold leading-snug text-transparent sm:text-[1.05rem]">
                  {e.name}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {e.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/[0.11] px-2.5 py-0.5 text-[0.7rem] font-medium text-[#f0d78c]/95 backdrop-blur-sm sm:text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-[0.8125rem] leading-relaxed text-zinc-400 tabular-nums sm:text-sm">
                  <span className="text-zinc-500">
                    {new Date(e.date).toLocaleDateString(dateLocaleTag(locale))}
                  </span>
                  <span className="mx-1.5 text-[#d4af37]/35">·</span>
                  <span>{e.time}</span>
                  <span className="mx-1.5 text-[#d4af37]/35">·</span>
                  <span className="text-zinc-300">{e.location}</span>
                </p>
                <p className="text-xs font-medium text-[#d4af37]/90 transition group-hover:text-[#f5e6a8] sm:text-[0.8125rem]">
                  {t("results.moreDetails")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {events.length === 0 && (
        <p className="py-12 text-center text-zinc-500">{t("results.noEvents")}</p>
      )}

      <nav
        className="mx-auto mt-10 max-w-lg border-t border-white/[0.06] pt-8 text-center text-xs text-zinc-600"
        aria-label="ניהול"
      >
        <Link href="/venue/login" className={`inline-block ${clubingMutedLink}`}>
          כניסת מועדון
        </Link>
        <span className="mx-3 text-zinc-700" aria-hidden>
          ·
        </span>
        <Link href="/admin/login" className={`inline-block ${clubingMutedLink}`}>
          מנהל מערכת
        </Link>
      </nav>
    </ClubingPageShell>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <ClubingPageShell contentClassName="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
        </ClubingPageShell>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
