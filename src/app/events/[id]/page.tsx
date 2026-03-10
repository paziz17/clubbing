"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WhatsAppIcon, SMSIcon, AppleMapsIcon, GoogleMapsIcon, WazeIcon } from "@/components/SocialIcons";


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
  const [numPeople, setNumPeople] = useState("2");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [over18, setOver18] = useState(false);
  const [reserveStatus, setReserveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then(setEvent);
  }, [id]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-12 h-12 border-2 border-white border-t-transparent" />
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
      await r.json();
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
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-50 flex justify-between items-center p-4 border-b border-[#1a1a1a] bg-black/90 backdrop-blur-sm">
        <Link href="/results" className="w-10 h-10 border border-[#1a1a1a] rounded-none flex items-center justify-center text-white hover:border-white/50 transition">
          ←
        </Link>
        <span className="text-zinc-500 text-xs tracking-widest uppercase">פרטי אירוע</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="aspect-[4/3] rounded-none overflow-hidden bg-[#0a0a0a] mb-8">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🎉</div>
          )}
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-white mb-4">{event.name}</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          {event.tags.map((t) => (
            <span key={t} className="px-3 py-1 border border-[#1a1a1a] text-sm text-zinc-400 uppercase tracking-wider">
              {t}
            </span>
          ))}
        </div>

        <div className="space-y-4 text-zinc-400 mb-8">
          <p>📅 {new Date(event.date).toLocaleDateString("he-IL")} • {event.time}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span>📍 {event.address || event.location}</span>
            <div className="flex gap-1">
              <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-[#1a1a1a] hover:border-white/50 transition" title="נווט באפל">
                <AppleMapsIcon className="w-5 h-5 text-white" />
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-[#1a1a1a] hover:border-white/50 transition" title="נווט בגוגל">
                <GoogleMapsIcon className="w-5 h-5" />
              </a>
              <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-[#1a1a1a] hover:border-white/50 transition" title="נווט ב-Waze">
                <WazeIcon className="w-5 h-5 text-[#33CCFF]" />
              </a>
            </div>
          </div>
          {event.phone && (
            <a href={`tel:${event.phone.replace(/\D/g, "")}`} className="block text-white hover:underline">
              📞 {event.phone}
            </a>
          )}
          {event.ageRestriction && <p>🔞 {event.ageRestriction}</p>}
        </div>

        {event.description && (
          <p className="mb-8 text-zinc-500">{event.description}</p>
        )}

        <div className="space-y-6">
          {reserveStatus === "success" && (
            <div className="py-4 px-4 border border-white/30 text-white text-center">
              ✅ ההזמנה נשלחה בהצלחה!
            </div>
          )}
          <form onSubmit={handleReserve} className="p-6 border border-[#1a1a1a] space-y-4">
              <h3 className="text-white font-semibold tracking-widest uppercase">הזמן מקום</h3>
              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">כמה אנשים</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numPeople}
                  onChange={(e) => setNumPeople(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white focus:outline-none focus:border-white/50 transition"
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">טלפון</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="050-1234567"
                  className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition"
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">מייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={over18}
                  onChange={(e) => setOver18(e.target.checked)}
                  required
                  className="w-5 h-5 rounded-none border-[#1a1a1a] bg-black text-white focus:ring-white/50"
                />
                <span className="text-zinc-400">אני מאשר/ת שמעל גיל 18</span>
              </label>
              <button
                type="submit"
                disabled={!over18 || reserveStatus === "loading"}
                className="w-full py-4 bg-white text-black font-semibold tracking-widest uppercase hover:bg-zinc-200 disabled:opacity-50 transition"
              >
                {reserveStatus === "loading" ? "שולח..." : "שלח הזמנה"}
              </button>
            </form>
          {event.ticketLink && !event.ticketLink.includes("example.com") && (
            <a
              href={event.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-white text-black text-center font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
            >
              רכישת כרטיסים
            </a>
          )}
          <div className="space-y-3">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">שתף חבר</p>
            <div className="flex gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 border border-[#1a1a1a] text-zinc-400 rounded-none hover:text-white hover:border-[#25D366] transition flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-6 h-6" />
                וואטסאפ
              </a>
              <a
                href={smsUrl}
                className="flex-1 py-3 border border-[#1a1a1a] text-zinc-400 rounded-none hover:text-white hover:border-white/30 transition flex items-center justify-center gap-2"
              >
                <SMSIcon className="w-6 h-6" />
                SMS
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
