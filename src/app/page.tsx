"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (search) params.set("music", search);
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showAuth />

      <main className="flex-1">
        {/* Hero - Eventbrite style */}
        <section className="bg-white border-b border-gray-200 py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-heading text-3xl sm:text-4xl text-gray-900 mb-2">
              אירועי מסיבות ורייבס בישראל
            </h1>
            <p className="text-gray-600 mb-8">
              גלה אירועים, מסיבות ומועדונים בהתאם לטעמך
            </p>

            {/* Search bar - Eventbrite style */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="חפש אירועים..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f05537]/50 focus:border-[#f05537]"
              />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f05537]/50"
              >
                <option value="">בחר מיקום</option>
                <option value="תל אביב">תל אביב</option>
                <option value="חיפה">חיפה</option>
                <option value="ירושלים">ירושלים</option>
                <option value="אילת">אילת</option>
                <option value="הרצליה">הרצליה</option>
                <option value="רמת גן">רמת גן</option>
              </select>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-[#f05537] hover:bg-[#e04a2d] text-white font-semibold rounded-md transition"
              >
                חפש
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/interests"
                className="text-[#f05537] hover:underline font-medium text-sm"
              >
                מצא אירועים
              </Link>
              <Link
                href="/auth"
                className="text-gray-600 hover:text-gray-900 transition text-sm"
              >
                התחברות / כניסה כאורח
              </Link>
            </div>
          </div>
        </section>

        {/* Quick links - Eventbrite style */}
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-gray-500 font-semibold text-sm uppercase tracking-wider mb-6">
              גלוש לפי
            </h2>
            <div className="flex flex-wrap gap-4">
              <Link href="/results" className="px-6 py-3 bg-white border border-gray-200 rounded-md text-gray-700 hover:border-[#f05537] hover:text-[#f05537] transition font-medium">
                כל האירועים
              </Link>
              <Link href="/interests" className="px-6 py-3 bg-white border border-gray-200 rounded-md text-gray-700 hover:border-[#f05537] hover:text-[#f05537] transition font-medium">
                פסטיבלים
              </Link>
              <Link href="/create" className="px-6 py-3 bg-white border border-gray-200 rounded-md text-gray-700 hover:border-[#f05537] hover:text-[#f05537] transition font-medium">
                הוסף אירוע
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
