"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

const MUSIC_KEYS = ["house", "techno", "mizrachi", "hiphop", "rock", "trance", "jazz", "pop"];
const EVENT_KEYS = ["bar", "party", "rooftop", "concert", "festival", "intimate"];
const AGE_RANGES = ["18-21", "21-25", "25-30", "30+"];
const REGIONS = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן"];

const MUSIC_TO_TAG: Record<string, string> = { house: "House", techno: "Techno", mizrachi: "מזרחית", hiphop: "Hip-Hop", rock: "רוק", trance: "Trance", jazz: "ג'אז", pop: "פופ" };
const EVENT_TO_TAG: Record<string, string> = { bar: "בר", party: "מסיבה", rooftop: "Rooftop", concert: "הופעה", festival: "פסטיבל", intimate: "אינטימי" };

const MUSIC_LABELS: Record<string, string> = { house: "House", techno: "Techno", mizrachi: "מזרחית", hiphop: "Hip-Hop", rock: "Rock", trance: "Trance", jazz: "Jazz", pop: "Pop" };
const EVENT_LABELS: Record<string, string> = { bar: "Bar", party: "Party", rooftop: "Rooftop", concert: "Concert", festival: "Festival", intimate: "Intimate" };

function InterestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [music, setMusic] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  const toggle = (arr: string[], set: (v: string[]) => void, item: string) => {
    if (arr.includes(item)) set(arr.filter((x) => x !== item));
    else set([...arr, item]);
  };

  const handleFind = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (music[0]) params.set("music", MUSIC_TO_TAG[music[0]] || music[0]);
    if (eventTypes[0]) params.set("eventType", EVENT_TO_TAG[eventTypes[0]] || eventTypes[0]);
    if (ageRange) params.set("age", ageRange.split("-")[0]);
    if (region) params.set("region", region);
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuth />

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="font-heading text-3xl sm:text-4xl text-white mb-3">
          {t("interests.title")}
        </h1>
        <p className="text-violet-400 text-sm mb-12">
          {t("interests.subtitle")}
        </p>

        <section className="mb-10">
          <h2 className="text-violet-400 text-xs uppercase tracking-wider mb-4 font-semibold">
            {t("interests.music")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {MUSIC_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => toggle(music, setMusic, key)}
                className={`px-4 py-3 rounded-lg border font-medium text-sm transition ${
                  music.includes(key)
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-[#1a0f2e] border-[#2d1b4e] text-violet-300 hover:border-violet-500/50"
                }`}
              >
                {MUSIC_LABELS[key] || key}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-violet-400 text-xs uppercase tracking-wider mb-4 font-semibold">
            {t("interests.eventType")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {EVENT_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => toggle(eventTypes, setEventTypes, key)}
                className={`px-4 py-3 rounded-lg border font-medium text-sm transition ${
                  eventTypes.includes(key)
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-[#1a0f2e] border-[#2d1b4e] text-violet-300 hover:border-violet-500/50"
                }`}
              >
                {EVENT_LABELS[key] || key}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-violet-400 text-xs uppercase tracking-wider mb-4 font-semibold">
            {t("interests.ageRange")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {AGE_RANGES.map((a) => (
              <button
                key={a}
                onClick={() => setAgeRange(ageRange === a ? "" : a)}
                className={`px-4 py-3 rounded-lg border font-medium text-sm transition ${
                  ageRange === a
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-[#1a0f2e] border-[#2d1b4e] text-violet-300 hover:border-violet-500/50"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-violet-400 text-xs uppercase tracking-wider mb-4 font-semibold">
            {t("interests.region")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(region === r ? "" : r)}
                className={`px-4 py-3 rounded-lg border font-medium text-sm transition ${
                  region === r
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-[#1a0f2e] border-[#2d1b4e] text-violet-300 hover:border-violet-500/50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={handleFind}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition"
        >
          {t("interests.findParty")}
        </button>

        <Link
          href="/results"
          className="block text-center text-violet-400 text-sm mt-6 hover:text-white transition"
        >
          {t("interests.showAll")}
        </Link>
      </main>

      <Footer />
    </div>
  );
}

export default function InterestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <InterestsContent />
    </Suspense>
  );
}
