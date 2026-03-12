"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => router.replace("/auth"), 2000);
    return () => clearTimeout(t);
  }, [mounted, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-6xl font-bold text-[#d4af37] tracking-tight">
        CLUBBING
      </h1>
      <p className="text-xl text-zinc-400 mt-2 tracking-widest">
        Join the Party
      </p>
      <div className="mt-12 w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
