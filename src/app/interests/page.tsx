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
      <div className="inline-flex px-6 py-2 rounded-full border border-[#d4af37]/70 mb-5">
        <h2 className="text-[#d4af37] text-sm font-semibold tracking-wide">
          {title}
        </h2>
      </div>
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
        px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
        select-none
        ${selected
          ? "bg-[#d4af37] border-2 border-[#d4af37] text-[#0a0a0a]"
          : "bg-transparent border-2 border-[#d4af37]/50 text-[#d4af37] hover:border-[#d4af37]/80"
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

  const totalSelected = music.length + eventTypes.length + (ageRange ? 1 : 0) + (region ? 1 : 0);
  const eventCount = totalSelected > 0 ? Math.min(8 + totalSelected * 2, 24) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#d4af37] mb-2">
            מה בא לך הערב?
          </h1>
          <p className="text-[#d4af37]/70 text-sm">
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
            className="w-full py-4 rounded-full font-semibold text-base bg-[#d4af37] text-[#0a0a0a] hover:bg-[#f0d78c] active:scale-[0.98] transition-all duration-200"
          >
            {eventCount > 0 ? `הצג תוצאות (${eventCount} אירועים)` : "מצא אירועים"}
          </button>

          <Link
            href="/results"
            className="block text-center text-[#d4af37]/70 hover:text-[#d4af37] text-sm py-3 transition"
          >
            הצג את כל האירועים
          </Link>
        </div>
      </div>
    </div>
  );
}
