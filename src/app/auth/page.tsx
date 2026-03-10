"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FacebookIcon, GoogleIcon, InstagramIcon } from "@/components/SocialIcons";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AuthPage() {
  const router = useRouter();
  const { loginGuest, signInWithProvider } = useAuth();

  const handleGuest = () => {
    loginGuest();
    router.replace("/interests");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showAuth={false} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <h1 className="font-heading text-3xl sm:text-4xl text-gray-900 mb-4">התחברות</h1>
        <p className="text-gray-600 text-sm mb-12">הצטרף לקהילה</p>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => signInWithProvider("facebook")}
            className="w-full py-4 px-6 bg-white border border-gray-300 rounded-md text-gray-700 flex items-center justify-center gap-3 hover:border-[#1877F2] hover:bg-[#1877F2]/5 transition"
          >
            <FacebookIcon className="w-6 h-6" />
            Facebook
          </button>
          <button
            onClick={() => signInWithProvider("instagram")}
            className="w-full py-4 px-6 bg-white border border-gray-300 rounded-md text-gray-700 flex items-center justify-center gap-3 hover:border-[#E4405F] hover:bg-[#E4405F]/5 transition"
          >
            <InstagramIcon className="w-6 h-6" />
            Instagram
          </button>
          <button
            onClick={() => signInWithProvider("google")}
            className="w-full py-4 px-6 bg-white border border-gray-300 rounded-md text-gray-700 flex items-center justify-center gap-3 hover:border-[#f05537] hover:bg-[#f05537]/5 transition"
          >
            <GoogleIcon className="w-6 h-6" />
            Google
          </button>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">או</span>
            </div>
          </div>
          <button
            onClick={handleGuest}
            className="w-full py-4 px-6 bg-[#f05537] hover:bg-[#e04a2d] text-white font-semibold rounded-md transition"
          >
            כניסה כאורח
          </button>
        </div>

        <Link href="/" className="mt-12 text-gray-600 hover:text-[#f05537] transition text-sm">
          ← חזרה
        </Link>
      </main>

      <Footer />
    </div>
  );
}
