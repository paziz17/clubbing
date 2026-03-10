"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const CITIES = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן", "נהריה", "עכו", "נתניה", "באר שבע"];

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0a0612] border-t border-[#2d1b4e] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-4">Cities</h4>
            <div className="flex flex-wrap gap-2">
              {CITIES.slice(0, 5).map((city) => (
                <Link key={city} href={`/results?region=${encodeURIComponent(city)}`} className="text-violet-300/80 hover:text-white text-sm transition">
                  {city}
                </Link>
              ))}
              <span className="text-violet-500 text-sm">·</span>
              <Link href="/results" className="text-violet-400 hover:text-white text-sm font-medium transition">
                View all
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-4">Links</h4>
            <div className="flex flex-wrap gap-4 text-violet-300/80 text-sm">
              <Link href="/support" className="hover:text-white transition">{t("footer.support")}</Link>
              <Link href="/about" className="hover:text-white transition">{t("footer.imprint")}</Link>
              <Link href="/privacy" className="hover:text-white transition">{t("footer.privacy")}</Link>
              <Link href="/terms" className="hover:text-white transition">{t("footer.terms")}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-4">Clubbing</h4>
            <p className="text-violet-300/70 text-sm">
              Concerts · Festivals · Raves
            </p>
          </div>
        </div>
        <div className="pt-8 border-t border-[#2d1b4e] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-violet-500/80 text-sm">
            © {new Date().getFullYear()} Clubbing. All rights reserved.
          </p>
          <div className="flex gap-6 text-violet-400/80 text-sm">
            <Link href="/support" className="hover:text-white transition">Contact</Link>
            <Link href="/about" className="hover:text-white transition">About Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
