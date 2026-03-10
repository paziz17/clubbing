"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WhatsAppIcon, SMSIcon, AppleMapsIcon, GoogleMapsIcon, WazeIcon } from "@/components/SocialIcons";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
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
      <div className="min-h-screen flex flex-col">
        <Header showAuth showBack backHref="/results" />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
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
    `📅 ${new Date(event.date).toLocaleDateString()} • ${event.time}`,
    `📍 ${address}`,
    ``,
    `Navigate: ${mapsUrl}`,
    `Details: ${eventUrl}`,
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuth showBack backHref="/results" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="rounded-xl overflow-hidden bg-[#1a0f2e] border border-[#2d1b4e] mb-8">
          <div className="aspect-[4/3] bg-[#0f0a1a] relative">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-violet-900/30 to-purple-900/20">
                🎉
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-white mb-4">{event.name}</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-[#1a0f2e] border border-[#2d1b4e] text-violet-400 text-sm rounded-lg"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="space-y-4 text-violet-400 mb-8">
          <p>📅 {formatDate(event.date)} • {event.time}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span>📍 {address}</span>
            <div className="flex gap-1">
              <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg hover:border-violet-500/50 transition" title="Apple Maps">
                <AppleMapsIcon className="w-5 h-5 text-white" />
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg hover:border-violet-500/50 transition" title="Google Maps">
                <GoogleMapsIcon className="w-5 h-5" />
              </a>
              <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg hover:border-violet-500/50 transition" title="Waze">
                <WazeIcon className="w-5 h-5 text-[#33CCFF]" />
              </a>
            </div>
          </div>
          {event.phone && (
            <a href={`tel:${event.phone.replace(/\D/g, "")}`} className="block text-white hover:text-violet-300">
              📞 {event.phone}
            </a>
          )}
          {event.ageRestriction && <p>🔞 {event.ageRestriction}</p>}
        </div>

        {event.description && <p className="mb-8 text-violet-300">{event.description}</p>}

        <div className="space-y-6">
          {reserveStatus === "success" && (
            <div className="py-4 px-4 bg-violet-600/20 border border-violet-500/50 text-white text-center rounded-lg">
              ✅ {t("event.reserveSuccess")}
            </div>
          )}
          <form onSubmit={handleReserve} className="p-6 bg-[#1a0f2e] border border-[#2d1b4e] rounded-xl space-y-4">
            <h3 className="text-white font-semibold">{t("event.reserve")}</h3>
            <div>
              <label className="block text-violet-400 text-sm mb-2">{t("event.howMany")}</label>
              <input
                type="number"
                min="1"
                max="20"
                value={numPeople}
                onChange={(e) => setNumPeople(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0f0a1a] border border-[#2d1b4e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-violet-400 text-sm mb-2">{t("event.phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="050-1234567"
                className="w-full px-4 py-3 bg-[#0f0a1a] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-violet-400 text-sm mb-2">{t("event.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-[#0f0a1a] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={over18}
                onChange={(e) => setOver18(e.target.checked)}
                required
                className="w-5 h-5 rounded border-[#2d1b4e] bg-[#0f0a1a] text-violet-600 focus:ring-violet-500/50"
              />
              <span className="text-violet-300">{t("event.confirmAge")}</span>
            </label>
            <button
              type="submit"
              disabled={!over18 || reserveStatus === "loading"}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg disabled:opacity-50 transition"
            >
              {reserveStatus === "loading" ? t("event.sending") : t("event.sendReserve")}
            </button>
          </form>
          {event.ticketLink && !event.ticketLink.includes("example.com") && (
            <a
              href={event.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-violet-600 hover:bg-violet-500 text-white text-center font-semibold rounded-lg transition"
            >
              {t("event.buyTickets")}
            </a>
          )}
          <div className="space-y-3">
            <p className="text-violet-400 text-sm font-medium">{t("event.shareFriend")}</p>
            <div className="flex gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#1a0f2e] border border-[#2d1b4e] text-violet-300 rounded-lg hover:border-[#25D366] hover:text-[#25D366] transition flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-6 h-6" />
                {t("event.whatsapp")}
              </a>
              <a
                href={smsUrl}
                className="flex-1 py-3 bg-[#1a0f2e] border border-[#2d1b4e] text-violet-300 rounded-lg hover:border-violet-500/50 hover:text-white transition flex items-center justify-center gap-2"
              >
                <SMSIcon className="w-6 h-6" />
                {t("event.sms")}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
