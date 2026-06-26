"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Sparkles,
  Heart,
  X,
  Calendar,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

interface Genre {
  id: string;
  title: string;      // Hebrew name
  titleEn: string;    // English name
  subtitleHe: string; // Hebrew style tags
  subtitleEn: string; // English style tags
  image: string;
  accent: string;
}

const GENRES: Genre[] = [
  { id: "pub_rock",   title: "פאב / רוק / בלוז",           titleEn: "Pub · Rock · Blues",      subtitleHe: "", subtitleEn: "", image: "/cards/rock.jpg",     accent: "#f87171" },
  { id: "lounge",     title: "בית קפה / לאונג' / צ'ילאאוט", titleEn: "Lounge · Chillout",       subtitleHe: "", subtitleEn: "", image: "/cards/lounge.jpg",   accent: "#fde68a" },
  { id: "nature",     title: "מסיבות טבע",                 titleEn: "Nature Parties",          subtitleHe: "", subtitleEn: "", image: "/cards/nature.jpg",   accent: "#86efac" },
  { id: "mizrahi",    title: "מזרחית / ים תיכוני",         titleEn: "מזרחית / ים תיכוני",     subtitleHe: "", subtitleEn: "", image: "/cards/mizrahi.jpg",  accent: "#fbbf24" },
  { id: "hiphop",     title: "היפ הופ",                    titleEn: "Hip-Hop",                 subtitleHe: "", subtitleEn: "", image: "/cards/hiphop.jpg",   accent: "#facc15" },
  { id: "pop",        title: "פופ מיינסטרים",              titleEn: "Mainstream Pop",          subtitleHe: "", subtitleEn: "", image: "/cards/pop.jpg",      accent: "#f472b6" },
  { id: "80s",        title: "שנות ה-80",                  titleEn: "80s",                     subtitleHe: "", subtitleEn: "", image: "/cards/80s.jpg",      accent: "#c084fc" },
  { id: "techno",     title: "טכנו",                       titleEn: "Techno",                  subtitleHe: "", subtitleEn: "", image: "/cards/techno.jpg",   accent: "#818cf8" },
];


interface AgeBand {
  id: string;
  label: string;
  accent: string;
}
const AGE_BANDS: AgeBand[] = [
  { id: "AGE_18_21",   label: "18–21", accent: "#FFE46E" },
  { id: "AGE_21_25",   label: "21–25", accent: "#FFE46E" },
  { id: "AGE_25_30",   label: "25–30", accent: "#FFE46E" },
  { id: "AGE_30_40",   label: "30–40", accent: "#FFE46E" },
  { id: "AGE_40_PLUS", label: "40+",   accent: "#FFE46E" },
];

interface Area {
  id: string; label: string; sub: string; emoji: string; accent: string; image: string;
}
const AREAS: Area[] = [
  { id: "tel-aviv",   label: "תל אביב",         sub: "הלב שפועם בלי הפסקה",       emoji: "🌊", accent: "#38bdf8", image: "/cards/city-telaviv.jpg" },
  { id: "gush-dan",   label: "גוש דן",          sub: "פרברים עם ויב עירוני",      emoji: "🏙️", accent: "#94a3b8", image: "/cards/city-gushdan.jpg" },
  { id: "rishon",     label: "ראשון לציון",     sub: "עיר צעירה ורוחשת חיים",     emoji: "🌆", accent: "#fbbf24", image: "/cards/city-rishon.jpg" },
  { id: "jerusalem",  label: "ירושלים",         sub: "עיר בין הרים עם נשמה",      emoji: "🕌", accent: "#f59e0b", image: "/cards/city-jerusalem.jpg" },
  { id: "haifa",      label: "חיפה והצפון",     sub: "מהכרמל ועד הגליל והעמקים",  emoji: "⛰️", accent: "#a78bfa", image: "/cards/city-haifa.jpg" },
  { id: "sharon",     label: "השרון / נתניה",   sub: "תרבות ואמנות ליד הים",      emoji: "🌿", accent: "#4ade80", image: "/cards/city-netanya.jpg" },
  { id: "south",      label: "דרום",            sub: "אופקים פתוחים ושמים",       emoji: "🌅", accent: "#fb923c", image: "/cards/city-south.jpg" },
  { id: "beersheva",  label: "באר שבע",         sub: "עיר הנגב שלא ישנה",         emoji: "🏜️", accent: "#d97706", image: "/cards/city-beersheva.jpg" },
  { id: "eilat",      label: "אילת",            sub: "ים אדום, ריזורט ולילה",     emoji: "🌊", accent: "#06b6d4", image: "/cards/city-eilat.jpg" },
  { id: "near-me",    label: "קרוב אליי",       sub: "האירועים הכי קרובים אליך",  emoji: "📍", accent: "#f472b6", image: "/cards/city-nearme.jpg" },
];

const TIMES = [
  { id: "tonight",  label: "הערב",           sub: "אירועים שמתחילים היום",  icon: <Calendar className="w-8 h-8" /> },
  { id: "weekend",  label: "סוף השבוע",       sub: "שישי–שבת הקרובים",        icon: <CalendarDays className="w-8 h-8" /> },
  { id: "week",     label: "השבוע הקרוב",    sub: "7 ימים קדימה",            icon: <ChevronRight className="w-8 h-8" /> },
];

// ─── Main page ────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

export default function DiscoverPage() {
  const router = useRouter();

  // Step 1 — Genres
  const [genreIdx, setGenreIdx] = useState(0);
  const [likedGenres, setLikedGenres] = useState<string[]>([]);
  const [exitDir, setExitDir] = useState<"up" | "down" | null>(null);

  // Steps 2–4
  const [step, setStep] = useState<Step>(1);
  const [ageBand, setAgeBand] = useState<string | null>(null);
  const [ageIdx, setAgeIdx] = useState(0);
  const [ageExitDir, setAgeExitDir] = useState<"up" | "down" | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [areaIdx, setAreaIdx] = useState(0);
  const [areaExitDir, setAreaExitDir] = useState<"up" | "down" | null>(null);
  const [timing, setTiming] = useState<string | null>(null);

  const totalSteps = 4;
  const progressPct = Math.round((step / totalSteps) * 100);

  // ── Genre swipe ──
  function commitGenre(dir: "up" | "down") {
    const current = GENRES[genreIdx];
    if (!current) return;
    setExitDir(dir);
    setTimeout(() => {
      if (dir === "up") setLikedGenres((prev) => [...prev, current.id]);
      setExitDir(null);
      if (genreIdx + 1 >= GENRES.length) {
        setStep(2);
      } else {
        setGenreIdx((i) => i + 1);
      }
    }, 280);
  }

  // ── Age swipe ──
  function commitAge(dir: "up" | "down") {
    const current = AGE_BANDS[ageIdx];
    if (!current) return;
    setAgeExitDir(dir);
    setTimeout(() => {
      if (dir === "up") { setAgeBand(current.id); setAgeExitDir(null); setStep(3); return; }
      setAgeExitDir(null);
      if (ageIdx + 1 >= AGE_BANDS.length) setStep(3);
      else setAgeIdx((i) => i + 1);
    }, 280);
  }

  // ── Area swipe ──
  function commitArea(dir: "up" | "down") {
    const current = AREAS[areaIdx];
    if (!current) return;
    setAreaExitDir(dir);
    // Picking "near me" without a stored fix → grab GPS now so results can use it.
    if (dir === "up" && current.id === "near-me" && !readStoredPosition() && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem(
            "clubbing.lastKnownPosition",
            JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() }),
          );
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
      );
    }
    setTimeout(() => {
      if (dir === "up") { setArea(current.id); setAreaExitDir(null); setStep(4); return; }
      setAreaExitDir(null);
      if (areaIdx + 1 >= AREAS.length) setStep(4);
      else setAreaIdx((i) => i + 1);
    }, 280);
  }

  // ── Finish ──
  function finish(finalTiming?: string) {
    const t = finalTiming ?? timing;
    persist({ genreLikes: likedGenres });
    const params = new URLSearchParams();
    if (likedGenres.length > 0) params.set("genres", likedGenres.join(","));
    if (ageBand) params.set("age", ageBand);
    if (area) params.set("area", area);
    if (t) params.set("timing", t);
    // "Near me" needs real coordinates so results can sort by distance / area.
    if (area === "near-me") {
      const pos = readStoredPosition();
      if (pos) {
        params.set("lat", String(pos.lat));
        params.set("lng", String(pos.lng));
      }
    }
    router.push(`/results?${params.toString()}`);
  }

  function readStoredPosition(): { lat: number; lng: number } | null {
    try {
      const raw = localStorage.getItem("clubbing.lastKnownPosition");
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (typeof p.lat === "number" && typeof p.lng === "number") {
        return { lat: p.lat, lng: p.lng };
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function persist(data: object) {
    fetch("/api/preferences", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
  }

  function skip() {
    finish();
  }

  // ── Back navigation: undo last step / move one step earlier ──
  function goBack() {
    if (step === 1) {
      // Back to the previous genre card, or back to the previous page in history
      if (genreIdx > 0) {
        setGenreIdx((i) => i - 1);
        setLikedGenres((prev) => {
          const last = GENRES[genreIdx - 1]?.id;
          return last ? prev.filter((id) => id !== last) : prev;
        });
        return;
      }
      router.back();
      return;
    }
    if (step === 2) {
      if (ageIdx > 0) {
        setAgeIdx((i) => i - 1);
        setAgeBand(null);
        return;
      }
      // Restart genre step from the last card so the user can review/change
      setGenreIdx(Math.max(0, GENRES.length - 1));
      setStep(1);
      return;
    }
    if (step === 3) {
      if (areaIdx > 0) {
        setAreaIdx((i) => i - 1);
        setArea(null);
        return;
      }
      setAgeIdx(Math.max(0, AGE_BANDS.length - 1));
      setAgeBand(null);
      setStep(2);
      return;
    }
    if (step === 4) {
      setTiming(null);
      setAreaIdx(Math.max(0, AREAS.length - 1));
      setArea(null);
      setStep(3);
    }
  }

  // ── Render ──
  return (
    <div className="mobile-screen">
      <StarsBackdrop />

      {/* ── Top bar ── */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-4 pb-1">
        <button
          onClick={goBack}
          aria-label="חזור"
          className="p-2 -ml-2 text-gold/80 hover:text-gold flex items-center gap-1 text-sm"
        >
          <ArrowRight className="w-5 h-5" />
          <span>חזור</span>
        </button>
        <h1 className="font-display text-xl text-gold-gradient tracking-[0.35em]">
          CLUBBING
        </h1>
        <button
          onClick={skip}
          className="text-sm text-gold/60 hover:text-gold transition-colors pr-1"
        >
          דלג/י ←
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="relative z-10 px-5 pb-2">
        <div className="flex items-center justify-between text-[11px] text-ink-muted mb-1.5 tracking-wider">
          <span className="text-gold font-semibold">{progressPct}%</span>
          <span>שלב {step} מתוך {totalSteps}</span>
        </div>
        <div className="h-[3px] w-full rounded-full bg-gold/15 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-gold via-gold/80 to-gold/30 shadow-[0_0_8px_rgba(201,162,74,0.5)]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
          />
        </div>
      </div>

      {/* ── Step subtitle ── */}
      <div className="relative z-10 text-center px-4" style={{ paddingBottom: step === 2 || step === 3 ? "6px" : "12px" }}>
        <AnimatePresence mode="wait">
          <motion.h2
            key={step}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{ fontSize: step === 2 || step === 3 ? "clamp(20px,5.5vw,26px)" : "26px" }}
            className="font-display leading-tight text-ink"
          >
            {step === 1 && "מה הז'אנר שלך?"}
            {step === 2 && "קהל הגיל?"}
            {step === 3 && "באיזה אזור?"}
            {step === 4 && "מתי?"}
          </motion.h2>
        </AnimatePresence>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">

          {/* STEP 1 — Genre swipe cards */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col pb-2">
              {/* Card area */}
              <div className="relative flex-1 min-h-0 flex items-stretch mx-2">
                {/* Card container */}
                <div className="relative mx-2 flex-1 min-h-0" style={{ minHeight: "220px" }}>
                  {/* Fan background cards */}
                  {[2, 1].map((depth) => {
                    const peek = GENRES[genreIdx + depth];
                    if (!peek) return null;
                    return (
                      <div key={`bg-${depth}`}
                        className="absolute inset-0 rounded-[24px] overflow-hidden border-2 border-gold/25"
                        style={{
                          transform: `rotate(${depth * 5}deg) scale(${1 - depth * 0.02})`,
                          transformOrigin: "center 110%",
                          opacity: 0.55 - depth * 0.15,
                          zIndex: -depth,
                        }}
                      >
                        <Image src={peek.image} alt="" fill sizes="400px" className="object-cover" />
                        <div className="absolute inset-0 bg-black/40" />
                      </div>
                    );
                  })}
                  <AnimatePresence mode="wait">
                    {GENRES[genreIdx] && (
                      <GenreSwipeCard key={GENRES[genreIdx].id} genre={GENRES[genreIdx]}
                        onSwipe={commitGenre} forcedExit={exitDir}
                        index={genreIdx} total={GENRES.length} />
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-center gap-2 pt-3 shrink-0">
                <button onClick={() => commitGenre("up")}
                  className="w-16 h-16 rounded-full bg-gradient-to-b from-gold to-[#b8902f] flex items-center justify-center shadow-[0_8px_28px_-8px_rgba(201,162,74,0.6)] active:scale-95 transition-transform">
                  <ArrowUp className="w-7 h-7 text-bg" strokeWidth={2.5} />
                </button>
                <button onClick={() => commitGenre("down")}
                  className="w-11 h-11 rounded-full border border-gold/40 bg-bg-card/60 flex items-center justify-center active:scale-95 transition-transform">
                  <ArrowDown className="w-5 h-5 text-gold" />
                </button>
              </div>

              {/* Selected chips + finish */}
              <div className="px-4 pt-2 shrink-0 min-h-[44px]">
                {likedGenres.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-1.5 justify-center mb-2">
                    {likedGenres.map((id) => {
                      const g = GENRES.find((g) => g.id === id);
                      return g ? (
                        <button key={id}
                          onClick={() => setLikedGenres((prev) => prev.filter((x) => x !== id))}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-gold/40 bg-gold/10 active:bg-gold/20">
                          <span className="text-[11px] text-gold">{g.title}</span>
                          <X className="w-3 h-3 text-gold/60" />
                        </button>
                      ) : null;
                    })}
                  </motion.div>
                )}
                {likedGenres.length > 0 && (
                  <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => setStep(2)}
                    className="w-full h-10 rounded-full bg-gold/90 text-bg font-semibold text-sm tracking-wide shadow-[0_4px_20px_-6px_rgba(201,162,74,0.6)] active:scale-[0.98] transition-transform">
                    סיים ← ({likedGenres.length} נבחרו)
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Age swipe cards (horizontal landscape style) */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center px-3 pt-1 pb-3 gap-3">

              {/* Card stack — fills available vertical space proportionally */}
              <div className="relative w-full flex-1 min-h-0">
                {/* Fan peek cards behind — pure brand colors (gold on black) */}
                {[3, 2, 1].map((depth) => {
                  const peek = AGE_BANDS[ageIdx + depth];
                  if (!peek) return null;
                  return (
                    <div key={`age-peek-${depth}`}
                      className="absolute inset-0 rounded-[22px] overflow-hidden border border-gold/40"
                      style={{
                        transform: `translateY(${depth * 8}px) scale(${1 - depth * 0.04})`,
                        transformOrigin: "center bottom",
                        opacity: 0.55 - depth * 0.12,
                        zIndex: -depth,
                        boxShadow: `0 0 18px -6px rgba(212,175,55,0.3)`,
                        background: `
                          radial-gradient(ellipse 70% 50% at 50% 50%, ${peek.accent}18 0%, transparent 65%),
                          radial-gradient(ellipse 120% 80% at 50% 110%, ${peek.accent}28 0%, transparent 60%),
                          linear-gradient(180deg, #0A0A10 0%, #06060A 100%)
                        `,
                      }}
                    />
                  );
                })}

                {/* Active age card */}
                <AnimatePresence mode="wait">
                  {AGE_BANDS[ageIdx] && (
                    <AgeSwipeCard key={AGE_BANDS[ageIdx].id} band={AGE_BANDS[ageIdx]}
                      onSwipe={commitAge} forcedExit={ageExitDir}
                      index={ageIdx} total={AGE_BANDS.length} />
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons — circular gold ↑/↓ matching reference */}
              <div className="flex flex-col items-center gap-2.5 shrink-0">
                <motion.button
                  onClick={() => commitAge("up")}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center"
                  style={{ background: "rgba(212,175,55,0.08)", boxShadow: "0 0 0 6px rgba(212,175,55,0.12), 0 0 24px 4px rgba(212,175,55,0.5)" }}
                  aria-label="זה אני"
                >
                  <ArrowUp className="w-6 h-6 text-gold" strokeWidth={2.5} />
                </motion.button>
                <motion.button
                  onClick={() => commitAge("down")}
                  whileTap={{ scale: 0.9 }}
                  className="w-11 h-11 rounded-full border-2 border-gold/55 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                  aria-label="דלג/י"
                >
                  <ArrowDown className="w-5 h-5 text-gold/85" strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Area swipe cards */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col pb-2">
              <div className="relative flex-1 min-h-0 flex items-stretch mx-2">
                <div className="relative mx-2 flex-1 min-h-0" style={{ minHeight: "200px" }}>
                  {[2, 1].map((depth) => {
                    const peek = AREAS[areaIdx + depth];
                    if (!peek) return null;
                    return (
                      <div key={`area-bg-${depth}`}
                        className="absolute inset-0 rounded-[24px] overflow-hidden border-2 border-gold/20"
                        style={{
                          transform: `rotate(${depth * 5}deg) scale(${1 - depth * 0.02})`,
                          transformOrigin: "center 110%",
                          opacity: 0.55 - depth * 0.12,
                          zIndex: -depth,
                        }}
                      >
                        <Image src={peek.image} alt="" fill sizes="400px" className="object-cover" />
                        <div className="absolute inset-0 bg-black/50" />
                        {/* City name peek label */}
                        <div className="absolute bottom-4 inset-x-0 text-center">
                          <span className="font-display text-lg opacity-70 text-gold">{peek.label}</span>
                        </div>
                      </div>
                    );
                  })}
                  <AnimatePresence mode="wait">
                    {AREAS[areaIdx] && (
                      <AreaSwipeCard key={AREAS[areaIdx].id} area={AREAS[areaIdx]}
                        onSwipe={commitArea} forcedExit={areaExitDir}
                        index={areaIdx} total={AREAS.length} />
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 pt-3 shrink-0">
                <button onClick={() => commitArea("up")}
                  className="w-16 h-16 rounded-full bg-gradient-to-b from-gold to-[#b8902f] flex items-center justify-center shadow-[0_8px_28px_-8px_rgba(201,162,74,0.6)] active:scale-95 transition-transform">
                  <ArrowUp className="w-7 h-7 text-bg" strokeWidth={2.5} />
                </button>
                <button onClick={() => commitArea("down")}
                  className="w-11 h-11 rounded-full border border-gold/40 bg-bg-card/60 flex items-center justify-center active:scale-95 transition-transform">
                  <ArrowDown className="w-5 h-5 text-gold" />
                </button>
              </div>
              <div className="h-11 shrink-0" />
            </motion.div>
          )}

          {/* STEP 4 — Timing */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex-1 px-5"
            >
              <div className="flex flex-col gap-4 mt-4">
                {TIMES.map((t) => (
                  <motion.button
                    key={t.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setTiming(t.id); setTimeout(() => finish(t.id), 280); }}
                    className={`flex flex-col items-center justify-center gap-2 w-full rounded-2xl border transition-all ${
                      timing === t.id
                        ? "border-gold bg-gold/10 shadow-[0_0_20px_-6px_rgba(201,162,74,0.5)]"
                        : "border-gold/25 bg-bg-card/50 hover:border-gold/50"
                    }`}
                    style={{ minHeight: "clamp(88px, 18vh, 120px)" }}
                  >
                    <span className={timing === t.id ? "text-gold" : "text-ink-muted"}>{t.icon}</span>
                    <div className="text-center">
                      <div className={`font-display text-2xl ${timing === t.id ? "text-gold" : "text-ink"}`}>
                        {t.label}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">{t.sub}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Sparkle preview + finish button */}
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 text-[11px] text-ink-muted mb-3">
                  <Sparkles className="w-3 h-3 text-gold" />
                  <span>הבחירות שלך יופיעו כאן</span>
                </div>
                <div className="flex justify-center flex-wrap gap-1.5 mb-5">
                  {likedGenres.map((id) => {
                    const g = GENRES.find((g) => g.id === id);
                    return g ? (
                      <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold">
                        {g.title}
                      </span>
                    ) : null;
                  })}
                  {ageBand && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card border border-line text-ink-muted">
                      {AGE_BANDS.find((a) => a.id === ageBand)?.label}
                    </span>
                  )}
                  {area && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card border border-line text-ink-muted">
                      {AREAS.find((a) => a.id === area)?.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => finish()}
                  className="w-full h-12 rounded-full border border-gold/40 bg-transparent text-gold hover:bg-gold/10 transition-colors text-sm tracking-widest"
                >
                  סיים ומצא לי ←
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Swipe card ───────────────────────────────────────────────────────────────

function GenreSwipeCard({
  genre,
  onSwipe,
  forcedExit,
  index,
  total,
}: {
  genre: Genre;
  onSwipe: (dir: "up" | "down") => void;
  forcedExit: "up" | "down" | null;
  index: number;
  total: number;
}) {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [-300, 0, 300], [-5, 0, 5]);
  const overlayUp = useTransform(y, [-180, -50, 0], [1, 0, 0]);
  const overlayDown = useTransform(y, [0, 50, 180], [0, 0, 1]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y < -90 || info.velocity.y < -500) onSwipe("up");
    else if (info.offset.y > 90 || info.velocity.y > 500) onSwipe("down");
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.65}
      onDragEnd={onDragEnd}
      style={{ y, rotate }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={
        forcedExit === "up"
          ? { y: -700, opacity: 0, transition: { duration: 0.28 } }
          : forcedExit === "down"
          ? { y: 700, opacity: 0, transition: { duration: 0.28 } }
          : { opacity: 1, scale: 1 }
      }
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="absolute inset-0 rounded-[28px] overflow-hidden border-[3px] border-gold/80 bg-black cursor-grab active:cursor-grabbing select-none shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(201,162,74,0.35),inset_0_0_0_1px_rgba(201,162,74,0.15)]"
    >
      {/* Photo */}
      <Image src={genre.image} alt={genre.title} fill priority sizes="500px" className="object-cover" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

      {/* Counter badge */}
      <div className="absolute top-4 left-4 text-[11px] text-white/60 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
        {index + 1} / {total}
      </div>

      {/* Bottom plate */}
      <div
        className="absolute inset-x-3 bottom-3 rounded-2xl backdrop-blur-md border px-5 py-4 text-center"
        style={{
          background: "rgba(0,0,0,0.72)",
          borderColor: `rgba(201,162,74,0.45)`,
          boxShadow: `0 0 24px -8px rgba(201,162,74,0.5)`,
        }}
      >
        <span className="font-display text-[22px] leading-tight tracking-[0.12em] text-gold text-center px-2">
          {genre.title}
        </span>
      </div>

      {/* Like overlay */}
      <motion.div
        style={{ opacity: overlayUp }}
        className="absolute inset-0 flex items-start justify-center pt-14 pointer-events-none"
      >
        <div className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl border-2 border-gold bg-gold/20 backdrop-blur-sm">
          <Heart className="w-8 h-8 text-gold fill-gold" />
          <span className="font-display text-gold text-lg">אהבתי</span>
        </div>
      </motion.div>

      {/* Skip overlay */}
      <motion.div
        style={{ opacity: overlayDown }}
        className="absolute inset-0 flex items-end justify-center pb-32 pointer-events-none"
      >
        <div className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl border-2 border-white/20 bg-black/60 backdrop-blur-sm">
          <X className="w-8 h-8 text-white/50" strokeWidth={3} />
          <span className="font-display text-white/50 text-lg">דלג/י</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Age swipe card — horizontal landscape style ─────────────────────────────

function AgeSwipeCard({ band, onSwipe, forcedExit, index, total }: {
  band: AgeBand; onSwipe: (dir: "up" | "down") => void;
  forcedExit: "up" | "down" | null; index: number; total: number;
}) {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [-200, 0, 200], [-3, 0, 3]);
  const overlayUp = useTransform(y, [-150, -40, 0], [1, 0, 0]);
  const overlayDown = useTransform(y, [0, 40, 150], [0, 0, 1]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y < -80 || info.velocity.y < -450) onSwipe("up");
    else if (info.offset.y > 80 || info.velocity.y > 450) onSwipe("down");
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.55}
      onDragEnd={onDragEnd}
      style={{ y, rotate,
        borderColor: `${band.accent}`,
        boxShadow: `0 0 0 1px ${band.accent}55, 0 0 32px -4px ${band.accent}AA, 0 0 80px -16px ${band.accent}80, 0 20px 60px -16px rgba(0,0,0,0.9)` }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={
        forcedExit === "up"   ? { y: -600, opacity: 0, transition: { duration: 0.28 } } :
        forcedExit === "down" ? { y:  600, opacity: 0, transition: { duration: 0.28 } } :
        { opacity: 1, scale: 1 }
      }
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="absolute inset-0 rounded-[22px] overflow-hidden border-2 cursor-grab active:cursor-grabbing select-none flex flex-col"
    >
      {/* Pure brand background — black with deep gold radial glow */}
      <div className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 50%, ${band.accent}22 0%, transparent 65%),
            radial-gradient(ellipse 120% 80% at 50% 110%, ${band.accent}38 0%, transparent 60%),
            linear-gradient(180deg, #0A0A10 0%, #06060A 100%)
          `,
        }} />

      {/* Subtle gold sparkle particles — top-right corner */}
      <div className="absolute top-0 right-0 w-2/3 h-1/3 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 100% at 70% 0%, ${band.accent}30 0%, transparent 65%)` }} />
      {/* Subtle bottom gold halo */}
      <div className="absolute bottom-0 inset-x-0 h-1/4 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 100% 100% at 50% 100%, ${band.accent}30 0%, transparent 70%)` }} />

      {/* Inner thin gold double-line frame for premium feel */}
      <div className="absolute inset-2 rounded-[18px] pointer-events-none"
        style={{ border: `1px solid ${band.accent}40`, boxShadow: `inset 0 0 60px ${band.accent}1A` }} />

      {/* Center — JUST the age number (gold gradient, glowing) */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
        <span
          className="font-display leading-none tabular-nums"
          style={{
            fontSize: "clamp(104px,30vw,176px)",
            color: band.accent,
            textShadow: `0 0 50px ${band.accent}, 0 0 100px ${band.accent}AA, 0 4px 16px rgba(0,0,0,0.7)`,
            background: `linear-gradient(180deg, #FFE680 0%, ${band.accent} 55%, #b8902f 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: `drop-shadow(0 0 50px ${band.accent}AA)`,
          }}
        >
          {band.label}
        </span>
      </div>

      {/* Drag overlays */}
      <motion.div style={{ opacity: overlayUp }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="px-8 py-3 rounded-2xl border-2 border-gold bg-gold/25 backdrop-blur-sm">
          <span className="font-display text-gold text-xl">זה אני ✓</span>
        </div>
      </motion.div>
      <motion.div style={{ opacity: overlayDown }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="px-8 py-3 rounded-2xl border-2 border-white/20 bg-black/55 backdrop-blur-sm">
          <span className="font-display text-white/50 text-xl">דלג/י</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Area swipe card ───────────────────────────────────────────────────────────

function AreaSwipeCard({ area, onSwipe, forcedExit, index, total }: {
  area: Area; onSwipe: (dir: "up" | "down") => void;
  forcedExit: "up" | "down" | null; index: number; total: number;
}) {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [-300, 0, 300], [-5, 0, 5]);
  const overlayUp = useTransform(y, [-180, -50, 0], [1, 0, 0]);
  const overlayDown = useTransform(y, [0, 50, 180], [0, 0, 1]);
  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y < -90 || info.velocity.y < -500) onSwipe("up");
    else if (info.offset.y > 90 || info.velocity.y > 500) onSwipe("down");
  }
  return (
    <motion.div drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.65}
      onDragEnd={onDragEnd}
      style={{ y, rotate, borderColor: "rgba(201,162,74,0.7)", boxShadow: "0 24px 60px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(201,162,74,0.25)" }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={forcedExit === "up" ? { y: -700, opacity: 0, transition: { duration: 0.28 } }
        : forcedExit === "down" ? { y: 700, opacity: 0, transition: { duration: 0.28 } }
        : { opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="absolute inset-0 rounded-[28px] overflow-hidden border-2 bg-black cursor-grab active:cursor-grabbing select-none"
    >
      {/* City photo */}
      <Image src={area.image} alt={area.label} fill priority sizes="500px" className="object-cover" />

      {/* Dark gradient overlay — bottom half */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/85 pointer-events-none" />

      {/* Counter */}
      <div className="absolute top-4 left-4 text-[11px] text-white/60 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
        {index + 1} / {total}
      </div>

      {/* Bottom plate */}
      <div
        className="absolute inset-x-3 bottom-3 rounded-2xl backdrop-blur-md border px-5 py-4 text-center"
        style={{ background: "rgba(0,0,0,0.72)", borderColor: "rgba(201,162,74,0.45)",
          boxShadow: "0 0 24px -8px rgba(201,162,74,0.5)" }}
      >
        <div className="flex items-baseline justify-center gap-2 mb-1">
          <h3 className="font-display text-[clamp(26px,8vw,36px)] leading-tight text-gold">
            {area.label}
          </h3>
        </div>
        <p className="text-xs text-gold/60 tracking-wide">{area.sub}</p>
      </div>

      {/* Overlays */}
      <motion.div style={{ opacity: overlayUp }} className="absolute inset-0 flex items-start justify-center pt-14 pointer-events-none">
        <div className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl border-2 border-gold bg-gold/20 backdrop-blur-sm">
          <span className="font-display text-gold text-lg">כאן! ✓</span>
        </div>
      </motion.div>
      <motion.div style={{ opacity: overlayDown }} className="absolute inset-0 flex items-end justify-center pb-32 pointer-events-none">
        <div className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl border-2 border-white/20 bg-black/60 backdrop-blur-sm">
          <span className="font-display text-white/50 text-lg">דלג/י</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Step 2 image grid ────────────────────────────────────────────────────────

function StepImageGrid({
  items,
  value,
  onSelect,
}: {
  items: { id: string; label: string; icon: string; desc: string; image: string }[];
  value: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex-1 px-5"
    >
      <div className="grid grid-cols-2 gap-3 mt-2">
        {items.map((item) => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(item.id)}
            className={`relative h-36 rounded-2xl overflow-hidden border transition-all ${
              value === item.id
                ? "border-gold shadow-[0_0_20px_-6px_rgba(201,162,74,0.6)]"
                : "border-gold/20"
            }`}
          >
            <Image src={item.image} alt={item.label} fill sizes="200px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-3 text-right">
              <div className="text-lg mb-0.5">{item.icon}</div>
              <div className="font-display text-base text-white leading-tight">{item.label}</div>
              <div className="text-[10px] text-white/60">{item.desc}</div>
            </div>
            {value === item.id && (
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center text-bg text-xs font-bold">
                ✓
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Stars backdrop ───────────────────────────────────────────────────────────

function StarsBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold/70"
          style={{
            width: 1 + (i % 3),
            height: 1 + (i % 3),
            top: `${(i * 53) % 100}%`,
            left: `${(i * 37) % 100}%`,
          }}
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{ duration: 2.5 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.3 }}
        />
      ))}
    </div>
  );
}
