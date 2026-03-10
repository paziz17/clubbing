"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WhatsAppIcon, SMSIcon, AppleMapsIcon, GoogleMapsIcon, WazeIcon } from "@/components/SocialIcons";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header showAuth showBack backHref="/results" />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin w-12 h-12 border-2 border-[#f05537] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const address = event.address || event.location;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${id}` : "";

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
        body: JSON.stringify({ numPeople: parseInt(numPeople, 10) || 1, phone, email, over18 }),
      });
      await r.json();
      if (r.ok) {
        setReserveStatus("success");
        setNumPeople("2");
        setPhone("");
        setEmail("");
        setOver18(false);
      } else setReserveStatus("error");
    } catch {
      setReserveStatus("error");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showAuth showBack backHref="/results" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          <div className="aspect-[4/3] bg-gray-100">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">🎉</div>
            )}
          </div>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-gray-900 mb-4">{event.name}</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          {event.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
              {tag}
            </span>
          ))}
        </div>

        <div className="space-y-4 text-gray-600 mb-8">
          <p>📅 {formatDate(event.date)} · {event.time}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span>📍 {address}</span>
            <div className="flex gap-1">
              <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-gray-200 rounded-md hover:border-[#f05537] transition" title="נווט באפל">
                <AppleMapsIcon className="w-5 h-5" />
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-gray-200 rounded-md hover:border-[#f05537] transition" title="נווט בגוגל">
                <GoogleMapsIcon className="w-5 h-5" />
              </a>
              <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-gray-200 rounded-md hover:border-[#f05537] transition" title="נווט ב-Waze">
                <WazeIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
          {event.phone && (
            <a href={`tel:${event.phone.replace(/\D/g, "")}`} className="block text-[#f05537] hover:underline">
              📞 {event.phone}
            </a>
          )}
          {event.ageRestriction && <p>🔞 {event.ageRestriction}</p>}
        </div>

        {event.description && <p className="mb-8 text-gray-600">{event.description}</p>}

        <div className="space-y-6">
          {reserveStatus === "success" && (
            <div className="py-4 px-4 bg-green-50 border border-green-200 text-green-800 text-center rounded-md">
              ✅ ההזמנה נשלחה בהצלחה!
            </div>
          )}
          <form onSubmit={handleReserve} className="p-6 bg-white border border-gray-200 rounded-lg space-y-4">
            <h3 className="text-gray-900 font-semibold">הזמן מקום</h3>
            <div>
              <label className="block text-gray-700 text-sm mb-2">כמה אנשים</label>
              <input type="number" min="1" max="20" value={numPeople} onChange={(e) => setNumPeople(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-2">טלפון</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="050-1234567" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-2">מייל</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={over18} onChange={(e) => setOver18(e.target.checked)} required className="rounded border-gray-300 text-[#f05537] focus:ring-[#f05537]" />
              <span className="text-gray-700">אני מאשר/ת שמעל גיל 18</span>
            </label>
            <button type="submit" disabled={!over18 || reserveStatus === "loading"} className="w-full py-4 bg-[#f05537] hover:bg-[#e04a2d] text-white font-semibold rounded-md disabled:opacity-50 transition">
              {reserveStatus === "loading" ? "שולח..." : "שלח הזמנה"}
            </button>
          </form>
          {event.ticketLink && !event.ticketLink.includes("example.com") && (
            <a href={event.ticketLink} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-[#f05537] hover:bg-[#e04a2d] text-white text-center font-semibold rounded-md transition">
              רכישת כרטיסים
            </a>
          )}
          <div className="space-y-3">
            <p className="text-gray-700 text-sm font-medium">שתף חבר</p>
            <div className="flex gap-3">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 border border-gray-200 rounded-md text-gray-700 hover:border-[#25D366] hover:text-[#25D366] transition flex items-center justify-center gap-2">
                <WhatsAppIcon className="w-6 h-6" />
                וואטסאפ
              </a>
              <a href={smsUrl} className="flex-1 py-3 border border-gray-200 rounded-md text-gray-700 hover:border-[#f05537] transition flex items-center justify-center gap-2">
                <SMSIcon className="w-6 h-6" />
                SMS
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
