"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const defaultTo = nextMonth.toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(defaultTo);

  const handleFind = () => {
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    router.push(`/interests?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a] bg-black/80 backdrop-blur-sm">
        <span className="text-zinc-500 text-sm tracking-widest uppercase">
          {new Date().getFullYear()} | Club with us
        </span>
        <Link href="/auth" className="text-white text-sm tracking-widest uppercase hover:text-zinc-400 transition">
          התחברות
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl text-white tracking-tight text-center mb-4">
          העתיד של הקלאבינג
        </h1>
        <p className="text-zinc-400 text-lg sm:text-xl tracking-widest uppercase mb-16">
          The Future Of Clubbing
        </p>

        <div className="w-full max-w-md space-y-6">
          <p className="text-white text-sm tracking-[0.2em] uppercase text-center">
            מצא תאריכים בשבילך
          </p>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">מ</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-none text-white focus:outline-none focus:border-white/50 transition"
              />
            </div>
            <div className="flex-1">
              <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">עד</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-none text-white focus:outline-none focus:border-white/50 transition"
              />
            </div>
          </div>
          <button
            onClick={handleFind}
            className="w-full py-4 bg-white text-black font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
          >
            מצא אירועים
          </button>
        </div>

        <Link
          href="/auth"
          className="mt-12 text-zinc-500 text-sm tracking-widest uppercase hover:text-white transition"
        >
          התחברות / כניסה כאורח
        </Link>
      </main>
    </div>
  );
}
