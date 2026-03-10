"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";


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
          <p>📍 {event.address || event.location}</p>
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
          <div className="flex gap-2 flex-wrap">
            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[100px] py-3 bg-[#16161d] border border-zinc-700 text-white text-center rounded-xl hover:border-zinc-500"
            >
              נווט באפל
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[100px] py-3 bg-[#16161d] border border-zinc-700 text-white text-center rounded-xl hover:border-zinc-500"
            >
              נווט בגוגל
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[100px] py-3 bg-[#16161d] border border-zinc-700 text-white text-center rounded-xl hover:border-[#33CCFF] hover:bg-[#33CCFF]/10"
            >
              נווט ב-Waze
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-500 text-sm">שתף חבר</p>
            <div className="flex gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-xl hover:text-white hover:border-[#25D366] hover:bg-[#25D366]/10 transition flex items-center justify-center gap-2"
              >
                <span className="text-lg">💬</span>
                וואטסאפ
              </a>
              <a
                href={smsUrl}
                className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-xl hover:text-white hover:border-zinc-500 transition flex items-center justify-center gap-2"
              >
                <span className="text-lg">📱</span>
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
