"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ClubingHeroBackground } from "@/components/ClubingHeroBackground";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingGlassCard } from "@/lib/clubing-ui";
import { setPostAuthRedirect } from "@/lib/post-auth-redirect";

const MUSIC_KEYS = ["music.house", "music.techno", "music.mizrachit", "music.hiphop", "music.rock", "music.trance"] as const;
const MUSIC_VALUES = ["האוס", "טכנו", "מזרחית", "היפ-הופ", "רוק", "טראנס"];

const EVENT_KEYS = ["event.bar", "event.party", "event.rooftop", "event.show", "event.festival", "event.nature"] as const;
const EVENT_VALUES = ["בר", "מסיבה", "Rooftop", "הופעה", "פסטיבל", "טבע"];

const AGE_RANGES = ["18-21", "21-25", "25-30", "30+", "40+"];

const REGION_KEYS = ["region.telaviv", "region.haifa", "region.jerusalem", "region.eilat", "region.herzliya", "region.ramatgan"] as const;
const REGION_VALUES = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן"];

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 sm:mb-8">
      <div className={`p-5 sm:p-7 ${clubingGlassCard}`}>
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/[0.07] shadow-[0_0_24px_rgba(212,175,55,0.12)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]" aria-hidden />
            <h2 className="text-sm sm:text-base font-semibold tracking-wide text-gradient-gold">{title}</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center">{children}</div>
      </div>
    </section>
  );
}

function Chip({
  label,
  selected,
  onClick,
  staggerDelay = 0,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  staggerDelay?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${staggerDelay}ms` }}
      className={`
        interests-chip-in px-5 py-2.5 rounded-full text-sm font-medium select-none
        transition-all duration-300 ease-out
        border
        active:scale-[0.97]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black
        ${
          selected
            ? "border-transparent bg-gradient-to-br from-[#f0d78c] via-[#d4af37] to-[#a67c00] text-[#0a0a0a] font-semibold shadow-[0_4px_24px_rgba(212,175,55,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] scale-[1.02]"
            : "border-[#d4af37]/35 bg-white/[0.04] text-[#e8c76b] backdrop-blur-md hover:border-[#d4af37]/65 hover:bg-[#d4af37]/[0.1] hover:text-[#f5e6a8] hover:shadow-[0_0_22px_rgba(212,175,55,0.18)]"
        }
      `}
    >
      {label}
    </button>
  );
}

export default function InterestsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [music, setMusic] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  const toggle = (arr: string[], set: (v: string[]) => void, item: string) => {
    if (arr.includes(item)) set(arr.filter((x) => x !== item));
    else set([...arr, item]);
  };

  const goToAuthThenResults = (resultsPath: string) => {
    setPostAuthRedirect(resultsPath);
    router.push("/auth");
  };

  const handleFind = () => {
    const params = new URLSearchParams();
    if (music[0]) params.set("music", music[0]);
    if (eventTypes[0]) params.set("eventType", eventTypes[0]);
    if (ageRange) params.set("age", ageRange.split("-")[0]);
    if (region) params.set("region", region);
    const qs = params.toString();
    goToAuthThenResults(qs ? `/results?${qs}` : "/results");
  };

  const handleShowAll = () => {
    goToAuthThenResults("/results");
  };

  const totalSelected = music.length + eventTypes.length + (ageRange ? 1 : 0) + (region ? 1 : 0);
  const eventCount = totalSelected > 0 ? Math.min(8 + totalSelected * 2, 24) : 0;

  /** השהיית כניסה לצ'יפים — קבועה לפי סדר (לא תלויה ב־re-render) */
  const d = (n: number) => n * 42;

  return (
    <ClubingHeroBackground
      variant="auth"
      className="flex min-h-[100dvh] flex-col px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-16 sm:pt-14"
    >
      <div className="mx-auto w-full max-w-2xl flex-1 py-6 sm:py-8">
        <header className="mb-10 text-center sm:mb-12">
          <div className="mx-auto mb-4 h-px max-w-[120px] bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
          <ClubingHeading size="xl" className="mb-3 leading-tight">
            {t("interests.title")}
          </ClubingHeading>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-400/95 sm:text-base">
            {t("interests.subtitle")}
          </p>
          <div className="mx-auto mt-5 h-px max-w-[80px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
        </header>

        <FilterSection title={t("interests.music")}>
          {MUSIC_KEYS.map((key, i) => (
            <Chip
              key={key}
              label={t(key)}
              selected={music.includes(MUSIC_VALUES[i])}
              onClick={() => toggle(music, setMusic, MUSIC_VALUES[i])}
              staggerDelay={d(i)}
            />
          ))}
        </FilterSection>

        <FilterSection title={t("interests.eventType")}>
          {EVENT_KEYS.map((key, i) => (
            <Chip
              key={key}
              label={t(key)}
              selected={eventTypes.includes(EVENT_VALUES[i])}
              onClick={() => toggle(eventTypes, setEventTypes, EVENT_VALUES[i])}
              staggerDelay={d(7 + i)}
            />
          ))}
        </FilterSection>

        <FilterSection title={t("interests.age")}>
          {AGE_RANGES.map((a, i) => (
            <Chip
              key={a}
              label={a}
              selected={ageRange === a}
              onClick={() => setAgeRange(ageRange === a ? "" : a)}
              staggerDelay={d(13 + i)}
            />
          ))}
        </FilterSection>

        <FilterSection title={t("interests.region")}>
          {REGION_KEYS.map((key, i) => (
            <Chip
              key={key}
              label={t(key)}
              selected={region === REGION_VALUES[i]}
              onClick={() => setRegion(region === REGION_VALUES[i] ? "" : REGION_VALUES[i])}
              staggerDelay={d(18 + i)}
            />
          ))}
        </FilterSection>

        <div className="mt-10 sm:mt-12 space-y-4">
          <button
            type="button"
            onClick={handleFind}
            className="group relative w-full overflow-hidden rounded-full py-4 text-base font-semibold text-[#0a0a0a] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d78c] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.99]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#c9a227] via-[#d4af37] to-[#f0d78c] transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10 drop-shadow-sm">
              {eventCount > 0
                ? `${t("interests.findWithCount")} (${eventCount} ${t("interests.events")})`
                : t("interests.find")}
            </span>
          </button>

          <button
            type="button"
            onClick={handleShowAll}
            className="w-full py-3 text-center text-sm text-zinc-500 underline-offset-4 transition-colors duration-200 hover:text-[#f0d78c] hover:underline"
          >
            {t("interests.showAll")}
          </button>
        </div>
      </div>
    </ClubingHeroBackground>
  );
}
