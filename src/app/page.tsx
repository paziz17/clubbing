"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (search) params.set("music", search);
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuth />

      <main className="flex-1">
        {/* Hero - Edmtrain style */}
        <section className="relative py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl text-white mb-4">
              Concerts · Festivals · Raves
            </h1>
            <p className="text-violet-300 text-lg mb-12">
              {t("home.subtitle")}
            </p>

            {/* Search bar - Edmtrain style */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Genre / Artist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
              />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="">Add Location</option>
                <option value="תל אביב">תל אביב</option>
                <option value="חיפה">חיפה</option>
                <option value="ירושלים">ירושלים</option>
                <option value="אילת">אילת</option>
                <option value="הרצליה">הרצליה</option>
                <option value="רמת גן">רמת גן</option>
              </select>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition"
              >
                Search
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/interests"
                className="px-6 py-3 border border-violet-500/50 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400 rounded-lg transition font-medium"
              >
                {t("home.findEvents")}
              </Link>
              <Link
                href="/auth"
                className="text-violet-400 hover:text-white transition text-sm"
              >
                {t("home.loginOrGuest")}
              </Link>
            </div>
          </div>
        </section>

        {/* Quick links - Edmtrain style */}
        <section className="py-12 px-4 sm:px-6 border-t border-[#2d1b4e]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-6 text-center">
              Browse by
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/results" className="px-6 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-violet-300 hover:border-violet-500/50 hover:text-white transition font-medium">
                All Events
              </Link>
              <Link href="/interests" className="px-6 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-violet-300 hover:border-violet-500/50 hover:text-white transition font-medium">
                Festivals
              </Link>
              <Link href="/create" className="px-6 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-violet-300 hover:border-violet-500/50 hover:text-white transition font-medium">
                Add Event
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
