"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WhatsAppIcon, SMSIcon, AppleMapsIcon, GoogleMapsIcon, WazeIcon, LocationPinIcon } from "@/components/SocialIcons";


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

export default function EventPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [numPeople, setNumPeople] = useState("2");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [over18, setOver18] = useState(false);
  const [reserveStatus, setReserveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <div className="animate-spin w-12 h-12 border-2 border-[#00d4ff] border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080810] gap-4">
        <p className="text-zinc-500">אירוע לא נמצא</p>
        <Link href="/results" className="text-[#ff2d6a] hover:text-[#ff6b35] transition">← חזרה לתוצאות</Link>
      </div>
    );
  }

  const address = event.address || event.location;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${id}` : `https://clubbing-omers-projects-fee986ef.vercel.app/events/${id}`;

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
      const data = await r.json();
      if (r.ok) {
        setReserveStatus("success");
        setNumPeople("2");
        setPhone("");
        setEmail("");
        setOver18(false);
      } else {
        setReserveStatus("error");
      }
    } catch {
      setReserveStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#080810]">
      <header className="flex justify-between items-center p-4 border-b border-[#00d4ff]/20">
        <Link href="/results" className="w-10 h-10 bg-[#0e0e16] border border-[#00d4ff]/40 rounded-full flex items-center justify-center text-white hover:border-[#00d4ff]/70 transition">
          ←
        </Link>
        <span className="text-zinc-500 text-sm">פרטי אירוע</span>
      </header>

      <div className="p-4">
        <div className="w-full max-w-md mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-[#ff2d6a]/20 mb-6">
          <img
            src={event.imageUrl || "https://images.unsplash.com/photo-1764510376258-2c9978ec3e4e?w=800&h=600&fit=crop"}
            alt={event.name}
            className="w-full h-full object-cover"
            onError={(ev) => {
              (ev.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1764510376258-2c9978ec3e4e?w=800&h=600&fit=crop";
            }}
          />
        </div>

        <div>
        <h1 className="text-2xl font-bold text-gradient-title">{event.name}</h1>
        <div className="flex gap-2 mt-2 flex-wrap">
          {event.tags.map((t) => (
            <span key={t} className="px-3 py-1 bg-[#ff2d6a]/20 border border-[#ff2d6a]/40 rounded-full text-sm text-zinc-300">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-4 text-zinc-300">
          <p>📅 {new Date(event.date).toLocaleDateString("he-IL")} • {event.time}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <LocationPinIcon className="w-4 h-4 text-[#ff2d6a] shrink-0" />
              {event.address || event.location}
            </span>
            <div className="flex gap-1">
              <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-zinc-700" title="נווט באפל">
                <AppleMapsIcon className="w-5 h-5 text-white" />
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-zinc-700" title="נווט בגוגל">
                <GoogleMapsIcon className="w-5 h-5" />
              </a>
              <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-zinc-700" title="נווט ב-Waze">
                <WazeIcon className="w-5 h-5 text-[#33CCFF]" />
              </a>
            </div>
          </div>
          {event.phone && (
            <a href={`tel:${event.phone.replace(/\D/g, "")}`} className="block text-[#ff2d6a] hover:text-[#ff6b35] transition">
              📞 {event.phone}
            </a>
          )}
          {event.ageRestriction && <p>🔞 {event.ageRestriction}</p>}
        </div>

        {event.description && (
          <p className="mt-6 text-zinc-400">{event.description}</p>
        )}

        <div className="mt-8 space-y-3">
          {reserveStatus === "success" && (
            <div className="py-4 px-4 bg-[#00d4ff]/20 border border-[#00d4ff]/50 rounded-xl text-[#00d4ff] text-center">
              ✅ ההזמנה נשלחה בהצלחה!
            </div>
          )}
          <form onSubmit={handleReserve} className="p-4 bg-[#0e0e16] border border-[#00d4ff]/30 rounded-xl space-y-4">
              <h3 className="text-white font-semibold">הזמן מקום</h3>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">כמה אנשים</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numPeople}
                  onChange={(e) => setNumPeople(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#080810] border border-[#00d4ff]/40 rounded-xl text-white focus:border-[#00d4ff]/70 focus:ring-1 focus:ring-[#00d4ff]/30"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">טלפון</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="050-1234567"
                  className="w-full px-4 py-3 bg-[#080810] border border-[#00d4ff]/40 rounded-xl text-white placeholder-zinc-500 focus:border-[#00d4ff]/70"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">מייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-[#080810] border border-[#00d4ff]/40 rounded-xl text-white placeholder-zinc-500 focus:border-[#00d4ff]/70"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={over18}
                  onChange={(e) => setOver18(e.target.checked)}
                  required
                  className="w-5 h-5 rounded border-[#00d4ff]/40 bg-[#080810] text-[#ff2d6a] focus:ring-[#ff2d6a]"
                />
                <span className="text-zinc-300">אני מאשר/ת שמעל גיל 18</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!over18 || reserveStatus === "loading"}
                  className="flex-1 py-3 bg-gradient-to-r from-[#ff2d6a] to-[#ff6b35] hover:shadow-[0_0_25px_rgba(255,45,106,0.4)] disabled:opacity-50 text-white rounded-xl font-semibold transition"
                >
                  {reserveStatus === "loading" ? "שולח..." : "שלח הזמנה"}
                </button>
              </div>
            </form>
          {event.ticketLink && !event.ticketLink.includes("example.com") && (
            <a
              href={event.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-gradient-to-r from-[#ff2d6a] to-[#ff6b35] hover:shadow-[0_0_25px_rgba(255,45,106,0.4)] text-white text-center rounded-xl font-semibold transition"
            >
              רכישת כרטיסים
            </a>
          )}
          <div className="space-y-2">
            <p className="text-zinc-500 text-sm">שתף חבר</p>
            <div className="flex gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-xl hover:text-white hover:border-[#25D366] hover:bg-[#25D366]/10 transition flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-6 h-6" />
                וואטסאפ
              </a>
              <a
                href={smsUrl}
                className="flex-1 py-3 border border-[#00d4ff]/40 text-zinc-400 rounded-xl hover:text-white hover:border-[#00d4ff]/70 transition flex items-center justify-center gap-2"
              >
                <SMSIcon className="w-6 h-6" />
                SMS
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
