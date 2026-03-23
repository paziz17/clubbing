"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ClubingHeroBackground } from "@/components/ClubingHeroBackground";
import { ClubingLogoIcon } from "@/components/ClubingLogoIcon";
import { TypewriterText } from "@/components/TypewriterText";

/** משך כולל עד מעבר ל־/interests (כולל פייד אאוט) */
const SPLASH_TOTAL_MS = 5000;
/** פייד בסוף — חלק מ־SPLASH_TOTAL_MS */
const SPLASH_FADE_MS = 520;

export default function SplashPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fadeStart = Math.max(0, SPLASH_TOTAL_MS - SPLASH_FADE_MS);
    const fadeTimer = window.setTimeout(() => setExiting(true), fadeStart);
    const navTimer = window.setTimeout(() => router.replace("/interests"), SPLASH_TOTAL_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(navTimer);
    };
  }, [mounted, router]);

  return (
    <div
      className={`min-h-[100dvh] w-full transition-[opacity,filter] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        exiting
          ? "pointer-events-none opacity-0 brightness-[0.72] motion-reduce:opacity-100 motion-reduce:brightness-100"
          : "opacity-100"
      }`}
      style={{ transitionDuration: `${SPLASH_FADE_MS}ms` }}
    >
      <ClubingHeroBackground
        variant="splash"
        imagePriority
        className="flex min-h-[100dvh] flex-col items-center justify-center px-4"
      >
        <div className="flex w-full flex-col items-center py-8">
          <h1 className="mb-2 w-full text-center text-4xl font-bold tracking-tight text-[#d4af37] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] md:text-6xl">
            CLUBING
          </h1>
          <div className="flex w-full max-w-md flex-col items-center">
            <TypewriterText
              text={t("splash.tagline")}
              speedMs={115}
              className="mx-auto mt-2 min-h-[1.75rem] w-full text-center text-xl tracking-widest text-zinc-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
            />
            <div
              aria-hidden
              className="mt-2.5 h-px w-full max-w-[min(100%,11rem)] rounded-full bg-gradient-to-r from-transparent via-[#e8c96b]/90 to-transparent shadow-[0_0_8px_rgba(212,175,55,0.28)]"
            />
          </div>
          <div className="mt-14 flex justify-center" aria-hidden>
            <ClubingLogoIcon className="h-14 w-14 animate-[spin_2.4s_linear_infinite] opacity-95 drop-shadow-[0_0_24px_rgba(212,175,55,0.45)] md:h-20 md:w-20" />
          </div>
        </div>
      </ClubingHeroBackground>
    </div>
  );
}
