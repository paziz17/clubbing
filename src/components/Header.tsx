"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LOCALES } from "@/lib/i18n";

interface HeaderProps {
  showAuth?: boolean;
  showBack?: boolean;
  backHref?: string;
}

export function Header({ showAuth = true, showBack = false, backHref = "/results" }: HeaderProps) {
  const { locale, setLocale, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLocale = LOCALES.find((l) => l.code === locale);

  return (
    <header className="sticky top-0 z-50 bg-[#1a0f2e]/95 backdrop-blur-md border-b border-[#2d1b4e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            {showBack && (
              <Link
                href={backHref}
                className="text-violet-300 hover:text-white transition text-sm font-medium"
              >
                ← {t("nav.back")}
              </Link>
            )}
            <Link href="/" className="font-heading text-xl text-white tracking-tight">
              Clubbing
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/results" className="text-violet-300 hover:text-white transition text-sm font-medium">
                Events
              </Link>
              <Link href="/interests" className="text-violet-300 hover:text-white transition text-sm font-medium">
                Festivals
              </Link>
              <Link href="/create" className="text-violet-300 hover:text-white transition text-sm font-medium">
                Artists
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={ref}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-violet-300 hover:text-white text-sm font-medium rounded-lg hover:bg-white/5 transition"
              >
                <span>{currentLocale?.label ?? "EN"}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute top-full end-0 mt-1 min-w-[140px] py-1 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg shadow-xl">
                  {LOCALES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLocale(l.code);
                        setLangOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition rounded ${
                        locale === l.code ? "text-white font-medium" : "text-violet-300"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showAuth && (
              <>
                <Link
                  href="/create"
                  className="hidden sm:block text-violet-300 hover:text-white text-sm font-medium transition"
                >
                  Add Event
                </Link>
                <Link
                  href="/auth"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition"
                >
                  {t("nav.login")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
