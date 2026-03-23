"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { LOCALES, isRtl } from "@/i18n/locales";
import { translate } from "@/i18n/dictionaries";

const STORAGE_KEY = "clubing_locale";
const LEGACY_LOCALE_KEY = "clubbing_locale";

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "he";
  const s =
    localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_LOCALE_KEY);
  if (s === "ar") return "he";
  if (s && LOCALES.includes(s as Locale)) return s as Locale;
  return "he";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("he");

  useEffect(() => {
    setLocaleState(readStoredLocale());
    if (typeof window === "undefined") return;
    const cur = localStorage.getItem(STORAGE_KEY);
    const leg = localStorage.getItem(LEGACY_LOCALE_KEY);
    if (!cur && leg && leg !== "ar" && LOCALES.includes(leg as Locale)) {
      localStorage.setItem(STORAGE_KEY, leg);
      localStorage.removeItem(LEGACY_LOCALE_KEY);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    localStorage.removeItem(LEGACY_LOCALE_KEY);
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const dir = useMemo((): "rtl" | "ltr" => (isRtl(locale) ? "rtl" : "ltr"), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, dir }),
    [locale, setLocale, t, dir]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
