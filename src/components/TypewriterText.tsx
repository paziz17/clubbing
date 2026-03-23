"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  /** מרווח בין תווים (מילישניות) */
  speedMs?: number;
  className?: string;
};

/** אפקט מכונת כתיבה — תו אחר תו + סמן מהבהב */
export function TypewriterText({ text, speedMs = 100, className = "" }: Props) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text, speedMs]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <p className={className} dir="ltr" aria-hidden>
        <span>{shown}</span>
        <span className="inline-block w-0.5 h-[1.15em] align-middle ml-1 rounded-sm bg-zinc-500 animate-pulse" />
      </p>
    </>
  );
}
