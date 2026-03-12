"use client";

import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold text-gradient-title mb-8">התחברות</h1>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => signInWithProvider("facebook")}
          className="w-full py-4 px-6 bg-[#0e0e16] border border-[#00d4ff]/40 rounded-2xl text-white flex items-center justify-center gap-3 hover:border-[#1877F2] hover:bg-[#1877F2]/10 transition"
        >
          <span className="text-[#1877F2]">
            <FacebookIcon className="w-6 h-6" />
          </span>
          Facebook
        </button>
        <button
          onClick={() => signInWithProvider("instagram")}
          className="w-full py-4 px-6 bg-[#0e0e16] border border-[#00d4ff]/40 rounded-2xl text-white flex items-center justify-center gap-3 hover:border-[#E4405F] hover:bg-[#E4405F]/10 transition"
        >
          <span className="text-[#E4405F]">
            <InstagramIcon className="w-6 h-6" />
          </span>
          Instagram
        </button>
        <button
          onClick={() => signInWithProvider("google")}
          className="w-full py-4 px-6 bg-[#0e0e16] border border-[#00d4ff]/40 rounded-2xl text-white flex items-center justify-center gap-3 hover:border-[#00d4ff]/70 transition"
        >
          <GoogleIcon className="w-6 h-6" />
          Google
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#00d4ff]/30" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#080810] text-zinc-500">או</span>
          </div>
        </div>
        <button
          onClick={handleGuest}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#ff2d6a] to-[#ff6b35] hover:shadow-[0_0_25px_rgba(255,45,106,0.4)] text-white rounded-2xl font-semibold transition"
        >
          כניסה כאורח
        </button>
      </div>
    </div>
  );
}
