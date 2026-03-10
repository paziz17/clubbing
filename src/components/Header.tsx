"use client";

import Link from "next/link";

interface HeaderProps {
  showAuth?: boolean;
  showBack?: boolean;
  backHref?: string;
}

export function Header({ showAuth = true, showBack = false, backHref = "/results" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            {showBack && (
              <Link
                href={backHref}
                className="text-gray-600 hover:text-[#f05537] transition text-sm font-medium"
              >
                ← חזרה
              </Link>
            )}
            <Link href="/" className="font-heading text-xl text-[#f05537] font-bold tracking-tight">
              Clubbing
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/results" className="text-gray-700 hover:text-[#f05537] transition text-sm font-medium">
                מצא אירועים
              </Link>
              <Link href="/interests" className="text-gray-700 hover:text-[#f05537] transition text-sm font-medium">
                פסטיבלים
              </Link>
              <Link href="/create" className="text-gray-700 hover:text-[#f05537] transition text-sm font-medium">
                צור אירוע
              </Link>
            </nav>
          </div>

          {showAuth && (
            <div className="flex items-center gap-4">
              <Link
                href="/create"
                className="hidden sm:block text-gray-700 hover:text-[#f05537] text-sm font-medium transition"
              >
                צור אירוע
              </Link>
              <Link
                href="/auth"
                className="px-4 py-2 bg-[#f05537] hover:bg-[#e04a2d] text-white text-sm font-medium rounded-md transition"
              >
                התחברות
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
