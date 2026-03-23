"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { WhatsAppIcon, SMSIcon, AppleMapsIcon, GoogleMapsIcon, WazeIcon, LocationPinIcon } from "@/components/SocialIcons";
import { appUrl } from "@/lib/app-url";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingGlassCard, clubingGoldCta, clubingInput } from "@/lib/clubing-ui";

interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  address?: string;
  imageUrl?: string;
  ticketLink?: string;
  phone?: string;
  ageRestriction?: string;
  tags: string[];
}

const fallbackImg = "https://images.unsplash.com/photo-1764510376258-2c9978ec3e4e?w=800&h=600&fit=crop";

const reservationStorageKey = (eventId: string) => `clubing:reservation:${eventId}`;

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [numPeople, setNumPeople] = useState("2");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [over18, setOver18] = useState(false);
  const [reserveStatus, setReserveStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/events/${id}`)
      .then(async (r) => {
        try {
          const text = await r.text();
          const data = text ? JSON.parse(text) : null;
          if (r.ok && data && !data.error) setEvent(data);
          else setEvent(null);
        } catch {
          setEvent(null);
        }
      })
      .catch(() => setEvent(null))
      .finally(() => setLoaded(true));
  }, [id]);

  if (!loaded) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </ClubingPageShell>
    );
  }
  if (!event) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">אירוע לא נמצא</p>
        <Link href="/results" className="text-[#e8c96b] transition hover:text-[#f0d78c]">
          ← חזרה לתוצאות
        </Link>
      </ClubingPageShell>
    );
  }

  const address = event.address || event.location;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${id}` : appUrl(`/events/${id}`);

  const shareText = [
    `🎉 ${event.name}`,
    `📅 ${new Date(event.date).toLocaleDateString("he-IL")} • ${event.time}`,
    `📍 ${address}`,
    ``,
    `נווט: ${mapsUrl}`,
    `לפרטים: ${eventUrl}`,
  ].join("\n");

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!over18) return;
    setReserveStatus("loading");
    try {
      const r = await fetch(`/api/events/${id}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numPeople: parseInt(numPeople, 10) || 1,
          phone,
          email,
          over18,
        }),
      });
      if (r.ok) {
        const ref = `CLB-${Date.now().toString(36).toUpperCase()}`;
        try {
          sessionStorage.setItem(
            reservationStorageKey(id),
            JSON.stringify({
              numPeople: parseInt(numPeople, 10) || 1,
              phone: phone.trim(),
              email: email.trim(),
              at: Date.now(),
              ref,
            })
          );
        } catch {
          /* private mode / quota */
        }
        setNumPeople("2");
        setPhone("");
        setEmail("");
        setOver18(false);
        setReserveStatus("idle");
        router.push(`/events/${id}/reserved`);
      } else {
        setReserveStatus("error");
      }
    } catch {
      setReserveStatus("error");
    }
  };

  return (
    <ClubingPageShell>
      <header className="bg-black px-4 pb-5 pt-4">
        <div className="relative flex min-h-[2.75rem] items-center justify-center">
          <Link
            href="/results"
            className="absolute start-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d4af37]/40 bg-zinc-950/60 text-white transition hover:border-[#d4af37] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]"
          >
            ←
          </Link>
          <div className="flex w-full flex-col items-center px-12">
            <ClubingHeading
              as="h1"
              size="md"
              className="w-full text-center leading-snug"
            >
              {event.name}
            </ClubingHeading>
            <div
              aria-hidden
              className="mt-2.5 h-px w-full max-w-[min(100%,11rem)] rounded-full bg-gradient-to-r from-transparent via-[#e8c96b]/90 to-transparent shadow-[0_0_8px_rgba(212,175,55,0.28)]"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md p-4">
        <div className="mb-6 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-zinc-900 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <img
            src={event.imageUrl || fallbackImg}
            alt={event.name}
            className="h-full w-full object-cover"
            onError={(ev) => {
              (ev.target as HTMLImageElement).src = fallbackImg;
            }}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-3 py-1 text-sm text-[#f0d78c]/95"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-4 text-zinc-300">
          <p>
            📅 {new Date(event.date).toLocaleDateString("he-IL")} • {event.time}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <LocationPinIcon className="h-4 w-4 shrink-0 text-[#d4af37]" />
              {event.address || event.location}
            </span>
            <div className="flex gap-1">
              <a
                href={appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 transition hover:bg-zinc-800"
                title="נווט באפל"
              >
                <AppleMapsIcon className="h-5 w-5 text-white" />
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 transition hover:bg-zinc-800"
                title="נווט בגוגל"
              >
                <GoogleMapsIcon className="h-5 w-5" />
              </a>
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 transition hover:bg-zinc-800"
                title="נווט ב-Waze"
              >
                <WazeIcon className="h-5 w-5 text-[#33CCFF]" />
              </a>
            </div>
          </div>
          {event.phone && (
            <a
              href={`tel:${event.phone.replace(/\D/g, "")}`}
              className="block text-[#e8c96b] transition hover:text-[#f0d78c]"
            >
              📞 {event.phone}
            </a>
          )}
          {event.ageRestriction && <p>🔞 {event.ageRestriction}</p>}
        </div>

        {event.description && <p className="mt-6 text-zinc-400">{event.description}</p>}

        <div className="mt-8 space-y-3">
          <form onSubmit={handleReserve} className={`space-y-4 p-5 ${clubingGlassCard}`}>
            <h3 className="font-semibold text-white">הזמן מקום</h3>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">כמה אנשים</label>
              <input
                type="number"
                min={1}
                max={20}
                value={numPeople}
                onChange={(e) => setNumPeople(e.target.value)}
                required
                className={clubingInput}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">טלפון</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="050-1234567"
                className={clubingInput}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">מייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className={clubingInput}
              />
            </div>
            <label className="flex cursor-pointer select-none items-center gap-3">
              <input
                type="checkbox"
                checked={over18}
                onChange={(e) => setOver18(e.target.checked)}
                required
                className="h-5 w-5 rounded border-[#d4af37]/40 bg-black/50 text-[#d4af37] focus:ring-[#d4af37]"
              />
              <span className="text-zinc-300">אני מאשר/ת שמעל גיל 18</span>
            </label>
            <button
              type="submit"
              disabled={!over18 || reserveStatus === "loading"}
              className={`${clubingGoldCta} flex-1`}
            >
              {reserveStatus === "loading" ? "שולח..." : "שלח הזמנה"}
            </button>
          </form>
          {event.ticketLink && !event.ticketLink.includes("example.com") && (
            <a
              href={event.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full py-4 text-center ${clubingGoldCta}`}
            >
              רכישת כרטיסים
            </a>
          )}
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">את מי לעדכן?</p>
            <div className="flex gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#d4af37]/25 bg-zinc-950/45 py-3 text-zinc-400 backdrop-blur-sm transition hover:border-[#25D366] hover:bg-[#25D366]/10 hover:text-white"
              >
                <WhatsAppIcon className="h-6 w-6" />
                וואטסאפ
              </a>
              <a
                href={smsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#d4af37]/35 py-3 text-zinc-400 transition hover:border-[#d4af37] hover:text-white"
              >
                <SMSIcon className="h-6 w-6" />
                SMS
              </a>
            </div>
          </div>
        </div>
      </div>
    </ClubingPageShell>
  );
}
