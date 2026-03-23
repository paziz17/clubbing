"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export function DocumentLang() {
  const { locale, dir } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}
