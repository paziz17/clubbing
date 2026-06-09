"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";

/**
 * Auth screen — based on provided design (image 3).
 * Providers: Facebook (primary) · Instagram · Google · Email · Guest fallback.
 */
export default function AuthPage() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [enabledProviders, setEnabledProviders] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    getProviders().then((p) => {
      setEnabledProviders(new Set(Object.keys(p ?? {})));
    });
  }, []);

  const handleProvider = async (id: string) => {
    setLoadingProvider(id);
    // If OAuth provider isn't configured (demo mode), gracefully fall back
    // to guest sign-in so the user can continue exploring the app.
    if (!enabledProviders.has(id)) {
      await signIn("guest", {
        name: `דמו · ${id}`,
        callbackUrl: "/location",
        redirect: true,
      });
      return;
    }
    try {
      await signIn(id, { callbackUrl: "/location" });
    } catch {
      setLoadingProvider(null);
    }
  };

  const handleGuest = async () => {
    setLoadingProvider("guest");
    await signIn("guest", {
      name: "אורח",
      callbackUrl: "/location",
      redirect: true,
    });
  };

  return (
    <motion.div
      className="mobile-screen items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      {/* Subtle gold halo backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gold/[0.04] blur-3xl pointer-events-none" />

      {/* Brand header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-[clamp(24px,6vh,48px)] pb-2 flex flex-col items-center relative z-10 w-full"
      >
        <div className="relative w-[clamp(64px,16vw,88px)] h-[clamp(64px,16vw,88px)] mb-1 drop-shadow-[0_0_28px_rgba(201,162,74,0.55)]">
          <Image
            src="/icons/logo.png"
            alt="CLUBBING"
            fill
            priority
            sizes="88px"
            className="object-contain"
          />
        </div>
        <h1 className="font-display text-xl text-gold-gradient tracking-[0.4em]">
          CLUBBING
        </h1>
      </motion.div>

      {/* Bordered card — flex-1 so it grows on tall screens */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative mx-4 mt-[clamp(12px,3vh,28px)] w-[calc(100%-2rem)] max-w-md"
      >
        {/* Outer ornamental border */}
        <div className="absolute -inset-[2px] rounded-3xl bg-[linear-gradient(135deg,rgba(201,162,74,0.6),rgba(201,162,74,0.15)_30%,rgba(201,162,74,0.5)_50%,rgba(201,162,74,0.15)_70%,rgba(201,162,74,0.6))]" />
        <div className="relative rounded-3xl bg-bg-card/95 backdrop-blur-sm border border-gold/20 px-6 pt-9 pb-8 shadow-[0_10px_60px_-15px_rgba(0,0,0,0.7)]">
          {/* Decorative corner ornaments */}
          <CornerOrnaments />

          <div className="text-center mb-6">
            <h2 className="font-display text-[28px] leading-tight text-gold-gradient mb-2">
              ברוך/ה הבא/ה
            </h2>
            <p className="text-sm text-ink-muted">
              התחבר/י כדי לגלות את הלילה שלך
            </p>
          </div>

          <div className="space-y-3">
            {/* Facebook — primary (highlighted) */}
            <ProviderButton
              icon={<Facebook className="w-5 h-5 fill-[#1877F2] text-[#1877F2]" />}
              label="המשך/י עם Facebook"
              loading={loadingProvider === "facebook"}
              primary
              onClick={() => handleProvider("facebook")}
            />

            {/* Instagram */}
            <ProviderButton
              icon={<InstagramIcon />}
              label="המשך/י עם Instagram"
              loading={loadingProvider === "instagram"}
              onClick={() => handleProvider("instagram")}
            />

            {/* Google */}
            <ProviderButton
              icon={<GoogleIcon />}
              label="המשך/י עם Google"
              loading={loadingProvider === "google"}
              onClick={() => handleProvider("google")}
            />

            {/* Continue without login */}
            <button
              onClick={handleGuest}
              disabled={loadingProvider === "guest"}
              className="w-full text-center text-sm text-ink-muted hover:text-gold underline underline-offset-4 decoration-gold/40 hover:decoration-gold transition-colors pt-2"
            >
              {loadingProvider === "guest" ? "...טוען" : "המשך/י ללא התחברות"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Terms — mt-auto pushes it to bottom */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-[11px] text-ink-dim mt-[8vh] mb-4 px-8 leading-relaxed"
      >
        בהמשך/י את/ה מאשר/ת את{" "}
        <a className="underline decoration-gold/40">תנאי השימוש</a> ו
        <a className="underline decoration-gold/40">מדיניות הפרטיות</a>
      </motion.p>

    </motion.div>
  );
}

function ProviderButton({
  icon,
  label,
  loading,
  primary,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={
        primary
          ? "relative w-full h-12 rounded-xl bg-gradient-to-b from-gold/20 to-gold/5 border border-gold/60 flex items-center justify-center gap-3 text-ink hover:from-gold/30 hover:to-gold/10 transition-all shadow-[0_0_20px_-8px_rgba(201,162,74,0.5)]"
          : "relative w-full h-12 rounded-xl bg-bg/40 border border-gold/25 flex items-center justify-center gap-3 text-ink hover:border-gold/50 hover:bg-bg/60 transition-all"
      }
    >
      {loading ? (
        <span className="text-ink-muted text-sm">...טוען</span>
      ) : (
        <>
          <span className="absolute right-4 flex items-center">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </>
      )}
    </button>
  );
}

function CornerOrnaments() {
  return (
    <>
      <svg className="absolute top-2 right-2 w-5 h-5 text-gold/70" viewBox="0 0 20 20" fill="none">
        <path d="M2 7V2H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="3.5" cy="3.5" r="1" fill="currentColor" />
      </svg>
      <svg className="absolute top-2 left-2 w-5 h-5 text-gold/70" viewBox="0 0 20 20" fill="none">
        <path d="M18 7V2H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="16.5" cy="3.5" r="1" fill="currentColor" />
      </svg>
      <svg className="absolute bottom-2 right-2 w-5 h-5 text-gold/70" viewBox="0 0 20 20" fill="none">
        <path d="M2 13V18H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="3.5" cy="16.5" r="1" fill="currentColor" />
      </svg>
      <svg className="absolute bottom-2 left-2 w-5 h-5 text-gold/70" viewBox="0 0 20 20" fill="none">
        <path d="M18 13V18H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="16.5" cy="16.5" r="1" fill="currentColor" />
      </svg>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <defs>
        <linearGradient id="igGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="33%" stopColor="#DD2A7B" />
          <stop offset="66%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <Instagram className="w-5 h-5" stroke="url(#igGrad)" />
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#igGrad)" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="4" stroke="url(#igGrad)" strokeWidth="2" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="url(#igGrad)" />
    </svg>
  );
}
