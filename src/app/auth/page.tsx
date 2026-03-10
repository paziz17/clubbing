"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FacebookIcon, GoogleIcon, InstagramIcon } from "@/components/SocialIcons";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function AuthPage() {
  const router = useRouter();
  const { loginGuest, signInWithProvider } = useAuth();
  const { t } = useLanguage();

  const handleGuest = () => {
    loginGuest();
    router.replace("/interests");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuth={false} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <h1 className="font-heading text-3xl sm:text-4xl text-white mb-4">{t("auth.title")}</h1>
        <p className="text-violet-400 text-sm mb-12">{t("auth.subtitle")}</p>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => signInWithProvider("facebook")}
            className="w-full py-4 px-6 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white flex items-center justify-center gap-3 hover:border-[#1877F2] hover:bg-[#1877F2]/10 transition"
          >
            <FacebookIcon className="w-6 h-6" />
            Facebook
          </button>
          <button
            onClick={() => signInWithProvider("instagram")}
            className="w-full py-4 px-6 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white flex items-center justify-center gap-3 hover:border-[#E4405F] hover:bg-[#E4405F]/10 transition"
          >
            <InstagramIcon className="w-6 h-6" />
            Instagram
          </button>
          <button
            onClick={() => signInWithProvider("google")}
            className="w-full py-4 px-6 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white flex items-center justify-center gap-3 hover:border-violet-500 hover:bg-violet-500/10 transition"
          >
            <GoogleIcon className="w-6 h-6" />
            Google
          </button>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2d1b4e]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0f0a1a] text-violet-500">{t("auth.or")}</span>
            </div>
          </div>
          <button
            onClick={handleGuest}
            className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition"
          >
            {t("auth.guest")}
          </button>
        </div>

        <Link href="/" className="mt-12 text-violet-400 hover:text-white transition text-sm">
          {t("auth.back")}
        </Link>
      </main>

      <Footer />
    </div>
  );
}
