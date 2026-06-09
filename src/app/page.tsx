"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const RADIUS = 70;
const STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SVG_SIZE = (RADIUS + STROKE / 2 + 4) * 2; // 152

export default function SplashPage() {
  const router = useRouter();
  const [pct, setPct] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // At 5s start fade-out; navigate after fade completes (700ms)
    const fadeTimer = setTimeout(() => setFading(true), 5000);
    const navTimer = setTimeout(() => router.replace("/auth"), 5700);

    // Animate 0→100% counter in ~4.5s, ease-in-out
    let rafId: number;
    let startTs: number;
    const duration = 4500;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setPct(Math.round(eased * 100));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
      cancelAnimationFrame(rafId);
    };
  }, [router]);

  return (
    <motion.div
      className="mobile-screen"
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      {/* Stars background */}
      <div className="absolute inset-0">
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
            animate={{ opacity: [0.15, 0.85, 0.15] }}
            transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.3 }}
          />
        ))}
      </div>

      {/* Single centered block — text + logo together */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        {/* Gold halo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[80vw] h-[80vw] max-w-[360px] max-h-[360px] rounded-full bg-gold/10 blur-[90px]" />
        </div>

        {/* ── Text group ── */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(38px,10vw,56px)] leading-none tracking-[0.2em] text-gold-gradient mb-2"
        >
          CLUBBING
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-display italic text-gold/80 text-lg tracking-wide mb-1"
          style={{ fontFamily: "var(--font-display), serif", fontStyle: "italic" }}
        >
          Join The Party
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-ink-muted text-sm text-center"
        >
          האפליקציה שלך לחיי הלילה
        </motion.p>

        {/* ── Gap between text and logo ── */}
        <div style={{ height: "clamp(32px,8vh,64px)" }} />

        {/* ── Logo + ring + percentage ── */}
        <div className="flex flex-col items-center gap-3">
        {/* Ring + Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
          style={{ width: SVG_SIZE, height: SVG_SIZE }}
        >
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="absolute inset-0"
          >
            {/* Background track */}
            <circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              stroke="rgba(201,162,74,0.18)"
              strokeWidth={STROKE}
              fill="none"
            />

            {/* Animated gold fill ring */}
            <motion.circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              stroke="url(#goldRing)"
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 4.5, ease: [0.4, 0, 0.15, 1] }}
              style={{
                transform: `rotate(-90deg)`,
                transformOrigin: `${SVG_SIZE / 2}px ${SVG_SIZE / 2}px`,
              }}
            />

            {/* Shimmer glow dot at the progress tip */}
            <motion.circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2 - RADIUS}
              r={STROKE + 1}
              fill="rgba(255,228,110,0.85)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                filter: "blur(1.5px)",
                transform: `rotate(${pct * 3.6}deg)`,
                transformOrigin: `${SVG_SIZE / 2}px ${SVG_SIZE / 2}px`,
              }}
            />

            <defs>
              <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(180,140,50,0.7)" />
                <stop offset="55%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#FFE46E" />
              </linearGradient>
            </defs>
          </svg>

          {/* C Logo — centered inside ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative drop-shadow-[0_0_28px_rgba(201,162,74,0.7)]"
              style={{ width: RADIUS * 1.5, height: RADIUS * 1.5 }}
            >
              <Image
                src="/icons/logo.png"
                alt="CLUBBING"
                fill
                priority
                sizes="110px"
                className="object-contain"
              />
            </div>
          </div>
        </motion.div>

        {/* Percentage counter */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-mono text-[clamp(13px,3.5vw,16px)] text-gold/70 tabular-nums tracking-wider"
        >
          {pct}%
        </motion.span>
        </div>{/* end logo+ring+% */}
      </div>{/* end single centered block */}
    </motion.div>
  );
}
