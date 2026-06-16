"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Compass, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

/**
 * Location permission gate — shown right after authentication.
 * Asks the user for GPS access so we can surface nearby events,
 * clubs, cafes, and nature parties.
 *
 * Stores the decision in localStorage so returning users skip it:
 *   clubbing.locationDecision = "granted" | "denied" | "skipped"
 *   clubbing.lastKnownPosition = JSON.stringify({lat,lng,ts})
 */
export default function LocationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);

  // Note: the location prompt is always shown after login so the user can
  // (re)approve GPS access. Previous decision is kept only as a hint and
  // is *not* used to silently skip this screen.

  function goNext(delay = 600) {
    setTimeout(() => router.replace("/onboarding"), delay);
  }

  // Resolve coordinates to a city/area and persist everything we know so the
  // rest of the app (discover "near me", results) can use it.
  async function resolveAndStore(lat: number, lng: number, accuracy?: number) {
    localStorage.setItem(
      "clubbing.lastKnownPosition",
      JSON.stringify({ lat, lng, accuracy: accuracy ?? null, ts: Date.now() }),
    );
    try {
      const r = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (r.ok) {
        const d = await r.json();
        if (d.areaId) localStorage.setItem("clubbing.area", d.areaId);
        if (d.city) localStorage.setItem("clubbing.city", d.city);
        setPlace(d.city ?? d.areaLabel ?? null);
      }
    } catch {
      /* non-fatal — coordinates are stored regardless */
    }
  }

  // Last-resort approximate location from IP (Google Geolocation API) when the
  // user blocks GPS, so we can still surface something relevant nearby.
  async function tryIpFallback(): Promise<boolean> {
    try {
      const r = await fetch("/api/geolocate", { method: "POST" });
      if (!r.ok) return false;
      const d = await r.json();
      if (typeof d.lat === "number" && typeof d.lng === "number") {
        await resolveAndStore(d.lat, d.lng, d.accuracy);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("requesting");
      setErrorMsg(null);
      tryIpFallback().then((ok) => {
        localStorage.setItem("clubbing.locationDecision", ok ? "granted" : "denied");
        setStatus(ok ? "granted" : "denied");
        if (!ok) setErrorMsg("המכשיר שלך אינו תומך באיתור מיקום");
        goNext(ok ? 900 : 1200);
      });
      return;
    }

    setStatus("requesting");
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        localStorage.setItem("clubbing.locationDecision", "granted");
        await resolveAndStore(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        setStatus("granted");
        goNext(900);
      },
      async (err) => {
        // Permission/lookup failed — try IP before giving up.
        const ok = await tryIpFallback();
        if (ok) {
          localStorage.setItem("clubbing.locationDecision", "granted");
          setStatus("granted");
          goNext(900);
          return;
        }
        let msg = "לא הצלחנו לאתר את המיקום שלך";
        if (err.code === err.PERMISSION_DENIED) msg = "ההרשאה נדחתה — תוכל/י לאפשר מאוחר יותר מההגדרות";
        else if (err.code === err.TIMEOUT) msg = "הבקשה לקחה יותר מדי זמן";
        setErrorMsg(msg);
        localStorage.setItem("clubbing.locationDecision", "denied");
        setStatus("denied");
        setTimeout(() => router.replace("/onboarding"), 1500);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  function skip() {
    localStorage.setItem("clubbing.locationDecision", "skipped");
    router.replace("/onboarding");
  }

  return (
    <motion.div
      className="mobile-screen items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gold halo backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gold/[0.05] blur-3xl pointer-events-none" />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-gold/60"
            style={{
              width: 1 + (i % 3),
              height: 1 + (i % 3),
              top: `${(i * 53) % 100}%`,
              left: `${(i * 37) % 100}%`,
            }}
            animate={{ opacity: [0.15, 0.85, 0.15] }}
            transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.3 }}
          />
        ))}
      </div>

      {/* Top bar with back arrow */}
      <div className="relative z-20 w-full flex items-center justify-between px-5 pt-5 pb-1">
        <button
          onClick={() => router.back()}
          aria-label="חזור"
          className="p-2 -ml-2 text-gold/80 hover:text-gold flex items-center gap-1 text-sm"
        >
          <ArrowRight className="w-5 h-5" />
          <span>חזור</span>
        </button>
        <span className="w-12" />
      </div>

      {/* Brand header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 pt-2 pb-4 text-center"
      >
        <h1 className="font-display text-2xl text-gold-gradient tracking-[0.4em]">
          CLUBBING
        </h1>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 flex-1 w-full px-5 flex items-center"
      >
        <div className="w-full rounded-3xl bg-bg-card/95 backdrop-blur-sm border border-gold/25 px-6 pt-9 pb-7 shadow-[0_10px_60px_-15px_rgba(0,0,0,0.7)]">
          {/* Animated pin icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-24 h-24 rounded-full border-2 border-gold/40 bg-gold/10 flex items-center justify-center shadow-[0_0_40px_-8px_rgba(201,162,74,0.7)]"
            >
              <MapPin className="w-12 h-12 text-gold" strokeWidth={1.6} />
              {/* Pulsing ring */}
              <motion.span
                className="absolute inset-0 rounded-full border border-gold/60"
                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            </motion.div>
          </div>

          <h2 className="font-display text-[clamp(22px,6vw,28px)] text-gold-gradient text-center leading-tight mb-2">
            איפה את/ה רוצה לבלות?
          </h2>
          <p className="text-center text-sm text-ink-muted mb-6 leading-relaxed">
            הפעל/י את המיקום כדי שנמצא בשבילך מועדונים, ברים, בתי קפה
            ומסיבות טבע <span className="text-gold">קרוב אליך</span>
          </p>

          {/* Feature list */}
          <div className="space-y-3 mb-7">
            <FeatureRow
              icon={<Compass className="w-5 h-5 text-gold" />}
              text="מסיבות ומועדונים בסביבה הקרובה"
            />
            <FeatureRow
              icon={<Sparkles className="w-5 h-5 text-gold" />}
              text="המלצות חכמות לפי האזור שלך"
            />
            <FeatureRow
              icon={<ShieldCheck className="w-5 h-5 text-gold" />}
              text="המיקום נשמר רק במכשיר שלך"
            />
          </div>

          {/* Status / error message */}
          {status === "requesting" && (
            <p className="text-center text-xs text-gold/80 mb-3 animate-pulse">
              מאתר את המיקום שלך…
            </p>
          )}
          {status === "granted" && (
            <p className="text-center text-xs text-gold mb-3">
              {place ? `מצאנו אותך: ${place} ✓` : "נמצאת/ה ✓"} ממשיכים…
            </p>
          )}
          {errorMsg && (
            <p className="text-center text-xs text-red-400/80 mb-3">{errorMsg}</p>
          )}

          {/* CTAs */}
          <button
            onClick={requestLocation}
            disabled={status === "requesting" || status === "granted"}
            className="btn-gold w-full h-14 text-base font-semibold tracking-wide disabled:opacity-60"
          >
            {status === "requesting" ? "מאתר…" : "אפשר/י מיקום"}
          </button>

          <button
            onClick={skip}
            disabled={status === "requesting"}
            className="w-full h-11 mt-3 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            לא עכשיו
          </button>
        </div>
      </motion.div>

      {/* Footer note */}
      <p className="relative z-10 text-center text-[11px] text-ink-dim mt-3 mb-6 px-8 leading-relaxed">
        תוכל/י לשנות את ההרשאה בכל עת מההגדרות של המכשיר
      </p>
    </motion.div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm text-ink/90">{text}</span>
    </div>
  );
}
