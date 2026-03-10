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
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d12]">
        <div className="animate-spin w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full" />
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
    <div className="min-h-screen bg-[#0d0d12]">
      <header className="flex justify-between items-center p-4 border-b border-zinc-800">
        <Link href="/results" className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-white hover:bg-zinc-700">
          ←
        </Link>
        <span className="text-zinc-500 text-sm">פרטי אירוע</span>
      </header>

      <div className="p-4">
        <div className="w-full max-w-md mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 mb-6">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🎉</div>
          )}
        </div>

        <div>
        <h1 className="text-2xl font-bold text-white">{event.name}</h1>
        <div className="flex gap-2 mt-2 flex-wrap">
          {event.tags.map((t) => (
            <span key={t} className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-4 text-zinc-300">
          <p>📅 {new Date(event.date).toLocaleDateString("he-IL")} • {event.time}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span>📍 {event.address || event.location}</span>
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
            <a href={`tel:${event.phone.replace(/\D/g, "")}`} className="block text-rose-400 hover:text-rose-300">
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
            <div className="py-4 px-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-center">
              ✅ ההזמנה נשלחה בהצלחה!
            </div>
          )}
          <form onSubmit={handleReserve} className="p-4 bg-[#16161d] border border-zinc-700 rounded-xl space-y-4">
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
                  className="w-full px-4 py-3 bg-[#0d0d12] border border-zinc-700 rounded-xl text-white"
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
                  className="w-full px-4 py-3 bg-[#0d0d12] border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
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
                  className="w-full px-4 py-3 bg-[#0d0d12] border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={over18}
                  onChange={(e) => setOver18(e.target.checked)}
                  required
                  className="w-5 h-5 rounded border-zinc-600 bg-[#0d0d12] text-rose-500 focus:ring-rose-500"
                />
                <span className="text-zinc-300">אני מאשר/ת שמעל גיל 18</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!over18 || reserveStatus === "loading"}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-semibold"
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
              className="block w-full py-4 bg-rose-600 hover:bg-rose-500 text-white text-center rounded-xl font-semibold"
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
                className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-xl hover:text-white hover:border-zinc-500 transition flex items-center justify-center gap-2"
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
