"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FacebookIcon, GoogleIcon, InstagramIcon } from "@/components/SocialIcons";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "שגיאה בהגדרת ההתחברות. נסה שוב או פנה למפתח.",
  AccessDenied: "ההתחברות נדחתה.",
  Verification: "קישור ההתחברות פג תוקף. נסה שוב.",
  Default: "אירעה שגיאה בהתחברות. נסה שוב.",
};

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginGuest, signInWithProvider } = useAuth();
  const [providersReady, setProvidersReady] = useState<boolean | null>(null);
  const errorCode = searchParams.get("error");
  const errorMsg = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default) : null;

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((p) => setProvidersReady(Object.keys(p).length > 0))
      .catch(() => setProvidersReady(false));
  }, []);

  const handleGuest = () => {
    loginGuest();
    router.replace("/interests");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold text-[#d4af37] mb-8">התחברות</h1>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm text-center max-w-sm">
          {errorMsg}
        </div>
      )}

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => signInWithProvider("facebook")}
          className="w-full py-4 px-6 bg-[#111111] border border-[#d4af37]/40 rounded-2xl text-white flex items-center justify-center gap-3 hover:border-[#1877F2] hover:bg-[#1877F2]/10 transition"
        >
          <span className="text-[#1877F2]">
            <FacebookIcon className="w-6 h-6" />
          </span>
          Facebook
        </button>
        <button
          onClick={() => signInWithProvider("instagram")}
          className="w-full py-4 px-6 bg-[#111111] border border-[#d4af37]/40 rounded-2xl text-white flex items-center justify-center gap-3 hover:border-[#E4405F] hover:bg-[#E4405F]/10 transition"
        >
          <span className="text-[#E4405F]">
            <InstagramIcon className="w-6 h-6" />
          </span>
          Instagram
        </button>
        <button
          onClick={() => signInWithProvider("google")}
          className="w-full py-4 px-6 bg-[#111111] border border-[#d4af37]/40 rounded-2xl text-white flex items-center justify-center gap-3 hover:border-[#d4af37]/70 transition"
        >
          <GoogleIcon className="w-6 h-6" />
          Google
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d4af37]/30" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#0a0a0a] text-zinc-500">או</span>
          </div>
        </div>
        <button
          onClick={handleGuest}
          className="w-full py-4 px-6 bg-[#d4af37] hover:bg-[#f0d78c] text-[#0a0a0a] rounded-2xl font-semibold transition"
        >
          כניסה כאורח
        </button>
        {providersReady === false && (
          <a
            href="https://github.com/paziz17/clubbing/blob/main/FIX-LOGIN.md"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-amber-500/90 text-sm text-center mt-4 hover:underline"
          >
            התחברות לא מופעלת — הוראות תיקון
          </a>
        )}
      </div>
    </div>
  );
}
