"use client";

import Link from "next/link";

const CITIES = ["תל אביב", "חיפה", "ירושלים", "אילת", "הרצליה", "רמת גן", "נהריה", "נתניה", "באר שבע"];

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">ערים</h4>
            <div className="flex flex-wrap gap-2">
              {CITIES.slice(0, 5).map((city) => (
                <Link key={city} href={`/results?region=${encodeURIComponent(city)}`} className="text-gray-600 hover:text-[#f05537] text-sm transition">
                  {city}
                </Link>
              ))}
              <span className="text-gray-400">·</span>
              <Link href="/results" className="text-[#f05537] hover:underline text-sm font-medium">
                הצג הכל
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">קישורים</h4>
            <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
              <Link href="/support" className="hover:text-[#f05537] transition">תמיכה</Link>
              <Link href="/about" className="hover:text-[#f05537] transition">אודות</Link>
              <Link href="/privacy" className="hover:text-[#f05537] transition">מדיניות פרטיות</Link>
              <Link href="/terms" className="hover:text-[#f05537] transition">תנאי שימוש</Link>
            </div>
          </div>
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Clubbing</h4>
            <p className="text-gray-600 text-sm">
              אירועים · מסיבות · פסטיבלים
            </p>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Clubbing. כל הזכויות שמורות.
          </p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <Link href="/support" className="hover:text-[#f05537] transition">צור קשר</Link>
            <Link href="/about" className="hover:text-[#f05537] transition">אודותינו</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
