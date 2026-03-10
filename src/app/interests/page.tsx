"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MUSIC = ["האוס", "טכנו", "מזרחית", "היפ-הופ", "רוק", "טראנס", "ג'אז", "פופ"];
const EVENT_TYPES = ["בר", "מסיבה", "Rooftop", "הופעה", "פסטיבל", "אינטימי"];
const AGE_RANGES = ["18-21", "21-25", "25-30", "30+"];
const REGIONS = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן"];

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
    <div className="min-h-screen bg-[#0d0d12] px-6 py-8">
      <h1 className="text-2xl font-bold text-white text-center mb-8">
        מה בא לך הערב?
      </h1>

      <section className="mb-8">
        <h2 className="text-zinc-400 text-sm mb-4">סוג מוזיקה</h2>
        <div className="flex flex-wrap gap-3">
          {MUSIC.map((m) => (
            <button
              key={m}
              onClick={() => toggle(music, setMusic, m)}
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-sm font-medium transition ${
                music.includes(m)
                  ? "bg-rose-600 border-rose-500 text-white"
                  : "bg-[#16161d] border-zinc-600 text-zinc-400 hover:border-zinc-500"
              }`}
              title={m}
            >
              {m.length > 6 ? m.slice(0, 4) : m}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-zinc-400 text-sm mb-4">סוג אירוע</h2>
        <div className="flex flex-wrap gap-3">
          {EVENT_TYPES.map((e) => (
            <button
              key={e}
              onClick={() => toggle(eventTypes, setEventTypes, e)}
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-sm font-medium transition ${
                eventTypes.includes(e)
                  ? "bg-rose-600 border-rose-500 text-white"
                  : "bg-[#16161d] border-zinc-600 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-zinc-400 text-sm mb-4">טווח גילאים</h2>
        <div className="flex flex-wrap gap-3">
          {AGE_RANGES.map((a) => (
            <button
              key={a}
              onClick={() => setAgeRange(ageRange === a ? "" : a)}
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-sm font-medium transition ${
                ageRange === a
                  ? "bg-rose-600 border-rose-500 text-white"
                  : "bg-[#16161d] border-zinc-600 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-zinc-400 text-sm mb-4">אזור</h2>
        <div className="flex flex-wrap gap-3">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(region === r ? "" : r)}
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-sm font-medium transition ${
                region === r
                  ? "bg-rose-600 border-rose-500 text-white"
                  : "bg-[#16161d] border-zinc-600 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={handleFind}
        className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-lg transition"
      >
        מצא לי את המסיבה שלי
      </button>

      <Link href="/results" className="block text-center text-zinc-500 text-sm mt-4">
        הצג את כל האירועים
      </Link>
    </div>
  );
}
