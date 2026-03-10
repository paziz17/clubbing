"use client";

import Link from "next/link";

export function LogoHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#0d0d12] border-b border-zinc-800">
      <div className="flex justify-center items-center h-14 px-4">
        <Link
          href="/results"
          className="text-xl font-bold text-white tracking-tight hover:text-rose-500 transition"
        >
          CLUBBING
        </Link>
      </div>
    </header>
  );
}
