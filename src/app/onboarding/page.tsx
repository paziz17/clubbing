"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, X, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";

/**
 * Onboarding tutorial — shown once to new users right after sign-in.
 * Matches image 1: explains the swipe-up / swipe-down gesture system
 * before the user reaches the genre-discovery card stack.
 */
export default function OnboardingPage() {
  const router = useRouter();

  // Returning users skip straight to discovery
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("clubbing.seenOnboarding");
      if (seen === "1") {
        router.replace("/discover");
      }
    }
  }, [router]);

  function next() {
    if (typeof window !== "undefined") {
      localStorage.setItem("clubbing.seenOnboarding", "1");
    }
    router.push("/discover");
  }

  return (
    <div className="mobile-screen">
      {/* Star backdrop */}
      <StarsBackdrop />

      {/* Top bar — fixed height */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={() => router.back()}
          aria-label="חזור"
          className="p-2 -ml-2 text-gold/80 hover:text-gold flex items-center gap-1 text-sm"
        >
          <ArrowRight className="w-5 h-5" />
          <span>חזור</span>
        </button>

        <h1 className="font-display text-xl text-gold-gradient tracking-[0.4em]">
          CLUBBING
        </h1>

        <button
          onClick={next}
          className="text-sm text-gold/60 hover:text-gold transition-colors pr-1"
        >
          דלג ←
        </button>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 px-6 pt-3 pb-2 text-center"
      >
        <h2 className="font-display text-[clamp(28px,8vh,44px)] leading-tight text-gold-gradient mb-1">
          איך זה עובד?
        </h2>
        <p className="text-ink-muted text-sm">הלילה שלך — מחווה אחת</p>
      </motion.div>

      {/* Demo cards — flex-1 so they grow to fill available space */}
      <div className="relative z-10 flex-1 flex flex-col justify-evenly px-5 py-4">
        <TutorialRow
          direction="up"
          icon={<Heart className="w-6 h-6 fill-gold text-gold" />}
          label="אהבתי"
          sub="החלק/י למעלה — מסמן/ת התעניינות"
        />

        <TutorialRow
          direction="down"
          icon={<X className="w-6 h-6 text-ink-muted" strokeWidth={2.5} />}
          label="לא בשבילי"
          sub="החלק/י למטה — מדלג/ת לכרטיס הבא"
        />
      </div>

      {/* CTA — pinned to bottom */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 px-6 pb-8 pt-4"
      >
        <button
          onClick={next}
          className="btn-gold w-full h-14 text-base font-semibold tracking-wide"
        >
          הבנתי, יאללה לערב ←
        </button>
      </motion.div>
    </div>
  );
}

function TutorialRow({
  direction,
  icon,
  label,
  sub,
}: {
  direction: "up" | "down";
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  const Arrow = direction === "up" ? ArrowUp : ArrowDown;
  const tone = direction === "up" ? "text-gold" : "text-ink-muted";

  return (
    <div className="flex items-center gap-4">
      {/* Demo card with party preview */}
      <div className="relative w-1/2 aspect-[4/3] flex-shrink-0">
        <motion.div
          animate={
            direction === "up"
              ? { y: [0, -10, 0] }
              : { y: [0, 10, 0] }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-full h-full rounded-2xl overflow-hidden border border-gold/30 shadow-[0_0_30px_-10px_rgba(201,162,74,0.5)]"
        >
          <Image
            src="/cards/nightclub.png"
            alt=""
            fill
            sizes="200px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        </motion.div>

        {/* Floating directional arrow with glow */}
        <motion.div
          animate={{
            opacity: [0.3, 1, 0.3],
            y: direction === "up" ? [4, -4, 4] : [-4, 4, -4],
          }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className={`absolute ${direction === "up" ? "-bottom-7" : "-top-7"} left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center`}
        >
          <Arrow className="w-5 h-5 text-gold" />
        </motion.div>
      </div>

      {/* Label + description */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={tone}>{icon}</span>
          <h3 className={`font-display text-3xl ${direction === "up" ? "text-gold-gradient" : "text-ink"}`}>
            {label}
          </h3>
          <Arrow className={`w-6 h-6 ${tone}`} />
        </div>
        <p className="text-sm text-ink-muted leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}

function StarsBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold/70"
          style={{
            width: 1 + (i % 3),
            height: 1 + (i % 3),
            top: `${(i * 53) % 100}%`,
            left: `${(i * 37) % 100}%`,
          }}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{
            duration: 2 + (i % 5),
            repeat: Infinity,
            delay: (i % 7) * 0.3,
          }}
        />
      ))}
      {/* Center gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-gold/[0.06] blur-3xl" />
    </div>
  );
}
