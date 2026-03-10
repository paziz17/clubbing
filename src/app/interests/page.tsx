"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const MUSIC = ["האוס", "טכנו", "מזרחית", "היפ-הופ", "רוק", "טראנס", "ג'אז", "פופ"];
const EVENT_TYPES = ["בר", "מסיבה", "Rooftop", "הופעה", "פסטיבל", "אינטימי"];
const AGE_RANGES = ["18-21", "21-25", "25-30", "30+"];
const REGIONS = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן"];

const MUSIC_TO_TAG: Record<string, string> = { "האוס": "House", "טכנו": "Techno", "מזרחית": "מזרחית", "היפ-הופ": "Hip-Hop", "רוק": "רוק", "טראנס": "Trance", "ג'אז": "ג'אז", "פופ": "פופ" };
const EVENT_TO_TAG: Record<string, string> = { "בר": "בר", "מסיבה": "מסיבה", "Rooftop": "Rooftop", "הופעה": "הופעה", "פסטיבל": "פסטיבל", "אינטימי": "אינטימי" };

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
    if (music[0]) params.set("music", MUSIC_TO_TAG[music[0]] || music[0]);
    if (eventTypes[0]) params.set("eventType", EVENT_TO_TAG[eventTypes[0]] || eventTypes[0]);
    if (ageRange) params.set("age", ageRange.split("-")[0]);
    if (region) params.set("region", region);
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showAuth />

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="font-heading text-3xl sm:text-4xl text-gray-900 mb-3">
          מה בא לך הערב?
        </h1>
        <p className="text-gray-600 text-sm mb-12">
          בחר את ההעדפות שלך
        </p>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-8">
          <section>
            <h2 className="text-gray-700 font-semibold text-sm mb-4">סוג מוזיקה</h2>
            <div className="flex flex-wrap gap-3">
              {MUSIC.map((m) => (
                <button
                  key={m}
                  onClick={() => toggle(music, setMusic, m)}
                  className={`px-4 py-3 rounded-md border font-medium text-sm transition ${
                    music.includes(m)
                      ? "bg-[#f05537] border-[#f05537] text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-[#f05537]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-gray-700 font-semibold text-sm mb-4">סוג אירוע</h2>
            <div className="flex flex-wrap gap-3">
              {EVENT_TYPES.map((e) => (
                <button
                  key={e}
                  onClick={() => toggle(eventTypes, setEventTypes, e)}
                  className={`px-4 py-3 rounded-md border font-medium text-sm transition ${
                    eventTypes.includes(e)
                      ? "bg-[#f05537] border-[#f05537] text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-[#f05537]"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-gray-700 font-semibold text-sm mb-4">טווח גילאים</h2>
            <div className="flex flex-wrap gap-3">
              {AGE_RANGES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAgeRange(ageRange === a ? "" : a)}
                  className={`px-4 py-3 rounded-md border font-medium text-sm transition ${
                    ageRange === a
                      ? "bg-[#f05537] border-[#f05537] text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-[#f05537]"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-gray-700 font-semibold text-sm mb-4">אזור</h2>
            <div className="flex flex-wrap gap-3">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(region === r ? "" : r)}
                  className={`px-4 py-3 rounded-md border font-medium text-sm transition ${
                    region === r
                      ? "bg-[#f05537] border-[#f05537] text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-[#f05537]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </section>
        </div>

        <button
          onClick={handleFind}
          className="w-full mt-8 py-4 bg-[#f05537] hover:bg-[#e04a2d] text-white font-semibold rounded-md transition"
        >
          מצא לי את המסיבה שלי
        </button>

        <Link href="/results" className="block text-center text-gray-600 text-sm mt-6 hover:text-[#f05537] transition">
          הצג את כל האירועים
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin w-12 h-12 border-2 border-[#f05537] border-t-transparent rounded-full" />
        </div>
      }
    >
      <InterestsContent />
    </Suspense>
  );
}
