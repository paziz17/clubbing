"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LOCALE_FLAGS, LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/locales";
import { useLanguage } from "@/context/LanguageContext";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  /** רשימה אנכית — רוחב צר (דגל בלבד בכל שורה) */
  const FLAG_MENU_W = 76;

  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: FLAG_MENU_W });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 400;
    const padding = 12;
    const w = Math.min(FLAG_MENU_W, vw - padding * 2);
    let left = r.right - w;
    if (left < padding) left = padding;
    if (left + w > vw - padding) left = Math.max(padding, vw - w - padding);
    setMenuPos({
      top: r.bottom + 8,
      left,
      width: w,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onResize = () => updateMenuPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    if (!open) return;
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const pick = (l: Locale) => {
    setLocale(l);
    setOpen(false);
  };

  const menu = open && mounted ? (
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Languages"
      className="fixed rounded-xl bg-[#0a0a0a] shadow-2xl p-2 overscroll-contain border border-white/10"
      style={{
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        zIndex: 99999,
      }}
    >
      <div className="flex flex-col items-center gap-1.5">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            role="option"
            aria-selected={locale === l}
            aria-label={LOCALE_LABELS[l]}
            title={LOCALE_LABELS[l]}
            onClick={() => pick(l)}
            className={`
              flex items-center justify-center shrink-0 min-w-[48px] min-h-[48px] w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-lg text-3xl sm:text-[1.75rem] leading-none
              border border-transparent transition touch-manipulation
              active:scale-95
              ${
                locale === l
                  ? "bg-white/15 ring-1 ring-white/25"
                  : "bg-[#141414] hover:bg-[#222] hover:ring-1 hover:ring-white/15"
              }
            `}
          >
            <span className="pointer-events-none select-none">{LOCALE_FLAGS[l]}</span>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative shrink-0 z-[60]">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          requestAnimationFrame(() => updateMenuPosition());
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${LOCALE_LABELS[locale]} — ${open ? "Close" : "Change language"}`}
        title={LOCALE_LABELS[locale]}
        className="flex items-center justify-center gap-1 min-w-[56px] min-h-[52px] h-[52px] px-2 sm:min-w-[60px] sm:min-h-14 sm:h-14 sm:px-2.5 rounded-xl text-2xl sm:text-3xl leading-none border-0 bg-transparent hover:bg-white/5 active:bg-white/10 transition touch-manipulation"
      >
        <span className="pointer-events-none select-none">{LOCALE_FLAGS[locale]}</span>
        <svg
          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
