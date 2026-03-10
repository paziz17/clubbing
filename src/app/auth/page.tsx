"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FacebookIcon, GoogleIcon, InstagramIcon } from "@/components/SocialIcons";

export default function AuthPage() {
  const router = useRouter();
  const { loginGuest, signInWithProvider } = useAuth();

  const handleGuest = () => {
    loginGuest();
    router.replace("/interests");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a]">
        <Link href="/" className="font-heading text-xl text-white tracking-widest">CLUBBING</Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <h1 className="font-heading text-3xl sm:text-4xl text-white mb-4">התחברות</h1>
        <p className="text-zinc-500 text-sm tracking-widest uppercase mb-12">הצטרף לקהילה</p>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => signInWithProvider("facebook")}
            className="w-full py-4 px-6 bg-transparent border border-[#1a1a1a] rounded-none text-white flex items-center justify-center gap-3 hover:border-[#1877F2] transition"
          >
            <span className="text-[#1877F2]">
              <FacebookIcon className="w-6 h-6" />
            </span>
            Facebook
          </button>
          <button
            onClick={() => signInWithProvider("instagram")}
            className="w-full py-4 px-6 bg-transparent border border-[#1a1a1a] rounded-none text-white flex items-center justify-center gap-3 hover:border-[#E4405F] transition"
          >
            <span className="text-[#E4405F]">
              <InstagramIcon className="w-6 h-6" />
            </span>
            Instagram
          </button>
          <button
            onClick={() => signInWithProvider("google")}
            className="w-full py-4 px-6 bg-transparent border border-[#1a1a1a] rounded-none text-white flex items-center justify-center gap-3 hover:border-zinc-500 transition"
          >
            <GoogleIcon className="w-6 h-6" />
            Google
          </button>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1a1a1a]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-zinc-500 tracking-widest uppercase">או</span>
            </div>
          </div>
          <button
            onClick={handleGuest}
            className="w-full py-4 px-6 bg-white text-black font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
          >
            כניסה כאורח
          </button>
        </div>

        <Link href="/" className="mt-12 text-zinc-500 text-sm tracking-widest uppercase hover:text-white transition">
          ← חזרה
        </Link>
      </main>
    </div>
  );
}
