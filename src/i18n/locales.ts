export const LOCALES = ["he", "en", "es", "ru", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** דגלי emoji לבחירת שפה */
export const LOCALE_FLAGS: Record<Locale, string> = {
  he: "🇮🇱",
  en: "🇬🇧",
  es: "🇪🇸",
  ru: "🇷🇺",
  fr: "🇫🇷",
};

/** לנגישות (title / aria-label) */
export const LOCALE_LABELS: Record<Locale, string> = {
  he: "עברית",
  en: "English",
  es: "Español",
  ru: "Русский",
  fr: "Français",
};

export const RTL_LOCALES: Locale[] = ["he"];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}
