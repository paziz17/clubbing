"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MUSIC = ["האוס", "טכנו", "מזרחית", "היפ-הופ", "רוק", "טראנס", "ג'אז"];
const EVENT_TYPES = ["בר", "מסיבה", "Rooftop", "הופעה", "פסטיבל", "טבע"];
const AGE_RANGES = ["18-21", "21-25", "25-30", "30+", "40+"];
const REGIONS = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן"];

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 text-center">
      <h2 className="text-zinc-300 text-sm font-semibold uppercase tracking-wider mb-5">
        {title}
      </h2>
      <div className="flex flex-wrap gap-3 justify-center">{children}</div>
    </section>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200
        select-none
        ${selected
          ? "bg-rose-600 border-2 border-rose-500 text-white shadow-lg shadow-rose-900/30"
          : "bg-zinc-800/80 border-2 border-zinc-600 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
        }
      `}
    >
      {label}
    </button>
  );
}

export default function InterestsPage() {
  const router = useRouter();
  const [music, setMusic] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  const toggle = (arr: string[], set: (v: string[]) => void, item: string) => {
    if (arr.includes(item)) set(arr.filter((x) => x !== item));
    else set([...arr, item]);
  };

  const handleFind = () => {
    const params = new URLSearchParams();
    if (music[0]) params.set("music", music[0]);
    if (eventTypes[0]) params.set("eventType", eventTypes[0]);
    if (ageRange) params.set("age", ageRange.split("-")[0]);
    if (region) params.set("region", region);
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            מה בא לך הערב?
          </h1>
          <p className="text-zinc-500 text-sm">
            בחר את ההעדפות שלך ונמצא לך את האירועים המושלמים
          </p>
        </div>

        <FilterSection title="סוג מוזיקה">
          {MUSIC.map((m) => (
            <Chip
              key={m}
              label={m}
              selected={music.includes(m)}
              onClick={() => toggle(music, setMusic, m)}
            />
          ))}
        </FilterSection>

        <FilterSection title="סוג אירוע">
          {EVENT_TYPES.map((e) => (
            <Chip
              key={e}
              label={e}
              selected={eventTypes.includes(e)}
              onClick={() => toggle(eventTypes, setEventTypes, e)}
            />
          ))}
        </FilterSection>

        <FilterSection title="טווח גילאים">
          {AGE_RANGES.map((a) => (
            <Chip
              key={a}
              label={a}
              selected={ageRange === a}
              onClick={() => setAgeRange(ageRange === a ? "" : a)}
            />
          ))}
        </FilterSection>

        <FilterSection title="אזור">
          {REGIONS.map((r) => (
            <Chip
              key={r}
              label={r}
              selected={region === r}
              onClick={() => setRegion(region === r ? "" : r)}
            />
          ))}
        </FilterSection>

        <div className="mt-14 space-y-4">
          <button
            onClick={handleFind}
            className="w-full py-4 rounded-xl font-semibold text-base bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 active:scale-[0.98] transition-all duration-200"
          >
            מצא אירועים
          </button>

          <Link
            href="/results"
            className="block text-center text-zinc-500 hover:text-zinc-400 text-sm py-3 transition"
          >
            הצג את כל האירועים
          </Link>
        </div>
      </div>
    </div>
  );
}
