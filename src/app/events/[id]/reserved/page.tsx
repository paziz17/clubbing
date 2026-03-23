"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LocationPinIcon } from "@/components/SocialIcons";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingGlassCard } from "@/lib/clubing-ui";

interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  address?: string;
  phone?: string;
  tags: string[];
}

type StoredReservation = {
  numPeople: number;
  phone: string;
  email: string;
  at: number;
  ref: string;
};

const storageKey = (eventId: string) => `clubing:reservation:${eventId}`;

function MailGlowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className="text-[#d4af37]"
      />
      <path
        d="M4 7 12 13 20 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#f0d78c]"
      />
    </svg>
  );
}

export default function ReservedPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [stored, setStored] = useState<StoredReservation | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(storageKey(id)) : null;
    if (raw) {
      try {
        const p = JSON.parse(raw) as StoredReservation;
        if (p && typeof p.numPeople === "number" && p.email && p.ref) setStored(p);
      } catch {
        /* ignore */
      }
    }

    fetch(`/api/events/${id}`)
      .then(async (r) => {
        const text = await r.text();
        const data = text ? JSON.parse(text) : null;
        if (!cancelled && r.ok && data && !data.error) setEvent(data);
        else if (!cancelled) setEvent(null);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!loaded) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </ClubingPageShell>
    );
  }

  if (!stored) {
    return (
      <ClubingPageShell contentClassName="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-zinc-400">לא נמצאו פרטי הזמנה. ייתכן שפג תוקף הדף או שנפתח בלי להשלים הזמנה.</p>
        <Link
          href={`/events/${id}`}
          className="rounded-full border border-[#d4af37]/50 px-6 py-3 text-[#e8c96b] transition hover:border-[#d4af37] hover:text-[#f0d78c]"
        >
          חזרה לאירוע
        </Link>
        <Link href="/results" className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline">
          לתוצאות חיפוש
        </Link>
      </ClubingPageShell>
    );
  }

  if (!event) {
    return (
      <ClubingPageShell contentClassName="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-zinc-500">האירוע לא נמצא</p>
        <Link href="/results" className="text-[#e8c96b] hover:text-[#f0d78c]">
          ← חזרה לתוצאות
        </Link>
      </ClubingPageShell>
    );
  }

  const address = event.address || event.location;
  const when = `${new Date(event.date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${event.time ? ` · ${event.time}` : ""}`;

  return (
    <ClubingPageShell>
      <header className="flex items-center justify-between border-b border-[#d4af37]/25 bg-black/30 p-4 backdrop-blur-md">
        <Link
          href="/results"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d4af37]/40 bg-zinc-950/60 text-white transition hover:border-[#d4af37]"
        >
          ←
        </Link>
        <span className="text-sm text-zinc-500">פרטי הזמנה</span>
        <span className="w-10" />
      </header>

      <div className="mx-auto max-w-md space-y-5 p-4 pb-16">
        <div
          className="rounded-2xl border border-[#d4af37]/40 bg-[#14100c]/95 px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          role="status"
        >
          <div className="flex items-center justify-center gap-3">
            <span
              className="reserve-success-check inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#4ade80] to-[#16a34a] text-white shadow-[0_2px_10px_rgba(22,163,74,0.5),inset_0_1px_0_rgba(255,255,255,0.35)]"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span className="text-right font-semibold text-[#e8c96b]">ההזמנה נשלחה בהצלחה!</span>
          </div>
        </div>

        <div className={`flex gap-4 p-5 ${clubingGlassCard}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#d4af37]/[0.08] shadow-[0_0_24px_rgba(212,175,55,0.12)]">
            <MailGlowIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0 text-right">
            <p className="text-sm font-semibold text-gradient-gold">הפרטים נשלחו במייל</p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              שלחנו לאימייל שלך את <span className="text-zinc-300">אישור ההזמנה</span> ואת כל הפרטים — כדאי לשמור את ההודעה.
            </p>
            <p className="mt-2 truncate text-sm font-medium text-[#f0d78c]" title={stored.email}>
              {stored.email}
            </p>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">פרטי ההזמנה</h2>
          <div className={`space-y-3 p-5 ${clubingGlassCard}`}>
            <div className="flex justify-between gap-4 border-b border-[#d4af37]/15 pb-3 text-sm">
              <span className="text-zinc-500">מספר הזמנה</span>
              <span className="font-mono text-[#f0d78c]" dir="ltr">
                {stored.ref}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-[#d4af37]/15 pb-3 text-sm">
              <span className="text-zinc-500">מספר אורחים</span>
              <span className="font-medium text-zinc-200">{stored.numPeople}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-[#d4af37]/15 pb-3 text-sm">
              <span className="text-zinc-500">טלפון</span>
              <span className="text-left font-medium text-zinc-200" dir="ltr">
                {stored.phone}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-zinc-500">אימייל</span>
              <span className="max-w-[60%] truncate text-left text-zinc-200" dir="ltr" title={stored.email}>
                {stored.email}
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">המועדון / האירוע</h2>
          <div className={`space-y-4 p-5 ${clubingGlassCard}`}>
            <ClubingHeading size="md" className="text-right leading-snug">
              {event.name}
            </ClubingHeading>
            <p className="text-sm text-zinc-300">{when}</p>
            <p className="flex items-start gap-2 text-sm text-zinc-400">
              <LocationPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
              <span>{address}</span>
            </p>
            {event.phone && (
              <a
                href={`tel:${event.phone.replace(/\D/g, "")}`}
                className="inline-flex text-sm font-medium text-[#e8c96b] transition hover:text-[#f0d78c]"
              >
                📞 {event.phone}
              </a>
            )}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-2.5 py-0.5 text-xs text-[#f0d78c]/95"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <Link
          href={`/events/${id}`}
          className="block w-full rounded-full border border-[#d4af37]/40 py-3.5 text-center text-sm font-medium text-[#e8c96b] transition hover:border-[#d4af37] hover:bg-[#d4af37]/10"
        >
          חזרה לדף האירוע
        </Link>
      </div>
    </ClubingPageShell>
  );
}
