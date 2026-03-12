"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("22:00");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [ticketLink, setTicketLink] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (user?.isGuest) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
        <p className="text-zinc-400 mb-4">יצירת אירוע זמינה למשתמשים רשומים בלבד</p>
        <Link href="/auth" className="text-[#d4af37]">התחבר</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        date,
        time,
        location,
        address,
        description,
        ticketLink,
        phone: phone || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        createdById: user?.id,
      }),
    });
    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
        <p className="text-2xl mb-2">✅</p>
        <p className="text-white font-semibold mb-2">האירוע נשלח לאישור</p>
        <p className="text-zinc-500 text-sm mb-6">תקבל עדכון כשהמנהל יאשר</p>
        <Link href="/results" className="text-[#d4af37]">חזרה לאירועים</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-8">
      <Link href="/results" className="text-[#d4af37] mb-6 inline-block">← חזרה</Link>
      <h1 className="text-2xl font-bold text-white mb-8">Be The Party</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="שם האירוע"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="flex-1 px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-32 px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white"
          />
        </div>
        <input
          type="text"
          placeholder="מיקום"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500"
        />
        <input
          type="text"
          placeholder="כתובת"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500"
        />
        <textarea
          placeholder="תיאור קצר"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500 resize-none"
        />
        <input
          type="url"
          placeholder="קישור לרכישת כרטיסים / RSVP"
          value={ticketLink}
          onChange={(e) => setTicketLink(e.target.value)}
          className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500"
        />
        <input
          type="tel"
          placeholder="טלפון לתקשורת"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500"
        />
        <input
          type="text"
          placeholder="תיוגים (מופרדים בפסיק): House, 21+, Rooftop"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500"
        />
        <button
          type="submit"
          className="w-full py-4 bg-[#d4af37] hover:bg-[#f0d78c] text-[#0a0a0a] rounded-xl font-semibold"
        >
          פרסם אירוע
        </button>
      </form>
    </div>
  );
}
