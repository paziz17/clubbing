"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const MUSIC = ["האוס", "טכנו", "מזרחית", "היפ-הופ", "רוק", "טראנס", "ג'אז", "פופ"];
const EVENT_TYPES = ["בר", "מסיבה", "Rooftop", "הופעה", "פסטיבל", "אינטימי"];
const AGE_RANGES = ["18-21", "21-25", "25-30", "30+"];
const REGIONS = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן"];

function InterestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    if (music[0]) params.set("music", music[0]);
    if (eventTypes[0]) params.set("eventType", eventTypes[0]);
    if (ageRange) params.set("age", ageRange.split("-")[0]);
    if (region) params.set("region", region);
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-black px-6 py-6">
      <header className="flex justify-between items-center mb-8">
        <Link href="/" className="font-heading text-xl text-white tracking-widest">CLUBBING</Link>
        <Link href="/auth" className="text-zinc-500 text-sm tracking-widest uppercase">התחברות</Link>
      </header>
      <h1 className="font-heading text-3xl sm:text-4xl text-white text-center mb-4">
        מה בא לך הערב?
      </h1>
      <p className="text-zinc-500 text-sm tracking-widest uppercase text-center mb-12">
        בחר את ההעדפות שלך
      </p>

      <section className="mb-10">
        <h2 className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-4">סוג מוזיקה</h2>
        <div className="flex flex-wrap gap-3">
          {MUSIC.map((m) => (
            <button
              key={m}
              onClick={() => toggle(music, setMusic, m)}
              className={`w-14 h-14 rounded-none border flex items-center justify-center text-sm font-medium transition ${
                music.includes(m)
                  ? "bg-white border-white text-black"
                  : "bg-transparent border-[#1a1a1a] text-zinc-400 hover:border-zinc-500"
              }`}
              title={m}
            >
              {m.length > 6 ? m.slice(0, 4) : m}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-4">סוג אירוע</h2>
        <div className="flex flex-wrap gap-3">
          {EVENT_TYPES.map((e) => (
            <button
              key={e}
              onClick={() => toggle(eventTypes, setEventTypes, e)}
              className={`w-14 h-14 rounded-none border flex items-center justify-center text-sm font-medium transition ${
                eventTypes.includes(e)
                  ? "bg-white border-white text-black"
                  : "bg-transparent border-[#1a1a1a] text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-4">טווח גילאים</h2>
        <div className="flex flex-wrap gap-3">
          {AGE_RANGES.map((a) => (
            <button
              key={a}
              onClick={() => setAgeRange(ageRange === a ? "" : a)}
              className={`w-14 h-14 rounded-none border flex items-center justify-center text-sm font-medium transition ${
                ageRange === a
                  ? "bg-white border-white text-black"
                  : "bg-transparent border-[#1a1a1a] text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-4">אזור</h2>
        <div className="flex flex-wrap gap-3">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(region === r ? "" : r)}
              className={`w-14 h-14 rounded-none border flex items-center justify-center text-sm font-medium transition ${
                region === r
                  ? "bg-white border-white text-black"
                  : "bg-transparent border-[#1a1a1a] text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={handleFind}
        className="w-full py-4 bg-white text-black font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
      >
        מצא לי את המסיבה שלי
      </button>

      <Link href="/results" className="block text-center text-zinc-500 text-sm mt-6 tracking-widest uppercase hover:text-white transition">
        הצג את כל האירועים
      </Link>
    </div>
  );
}

export default function InterestsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin w-12 h-12 border-2 border-white border-t-transparent" /></div>}>
      <InterestsContent />
    </Suspense>
  );
}
