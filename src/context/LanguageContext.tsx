"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Locale, LOCALES, t } from "@/lib/i18n";

type LanguageContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "clubbing-locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("he");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && LOCALES.some((l) => l.code === stored)) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
      document.documentElement.dir = LOCALES.find((x) => x.code === l)?.dir ?? "ltr";
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
      document.documentElement.dir = LOCALES.find((x) => x.code === locale)?.dir ?? "ltr";
    }
  }, [locale, mounted]);

  const translate = useCallback((key: string) => t(locale, key), [locale]);

  const dir = LOCALES.find((x) => x.code === locale)?.dir ?? "ltr";

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translate, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
