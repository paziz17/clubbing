"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function CreateEventPage() {
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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <p className="text-zinc-400 mb-4">יצירת אירוע זמינה למשתמשים רשומים בלבד</p>
        <Link href="/auth" className="text-white border border-white px-6 py-3 tracking-widest uppercase hover:bg-white hover:text-black transition">התחבר</Link>
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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <p className="text-4xl mb-4">✅</p>
        <p className="text-white font-semibold mb-2">האירוע נשלח לאישור</p>
        <p className="text-zinc-500 text-sm mb-6">תקבל עדכון כשהמנהל יאשר</p>
        <Link href="/results" className="text-white border border-white px-6 py-3 tracking-widest uppercase hover:bg-white hover:text-black transition">חזרה לאירועים</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-8">
      <header className="flex justify-between items-center mb-8">
        <Link href="/results" className="text-zinc-500 text-sm tracking-widest uppercase hover:text-white transition">← חזרה</Link>
        <span className="font-heading text-xl text-white tracking-widest">CLUBBING</span>
      </header>

      <h1 className="font-heading text-3xl text-white mb-8">Be The Party</h1>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">שם האירוע</label>
          <input
            type="text"
            placeholder="שם האירוע"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">תאריך</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white focus:outline-none focus:border-white/50 transition"
            />
          </div>
          <div className="w-32">
            <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">שעה</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white focus:outline-none focus:border-white/50 transition"
            />
          </div>
        </div>
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">מיקום</label>
          <input
            type="text"
            placeholder="עיר / אזור"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">כתובת</label>
          <input
            type="text"
            placeholder="כתובת מלאה"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">תיאור</label>
          <textarea
            placeholder="תיאור קצר"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition resize-none"
          />
        </div>
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">קישור לכרטיסים</label>
          <input
            type="url"
            placeholder="https://..."
            value={ticketLink}
            onChange={(e) => setTicketLink(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">טלפון</label>
          <input
            type="tel"
            placeholder="טלפון לתקשורת"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2">תיוגים</label>
          <input
            type="text"
            placeholder="House, 21+, Rooftop (מופרדים בפסיק)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-[#1a1a1a] text-white placeholder-zinc-600 focus:outline-none focus:border-white/50 transition"
          />
        </div>
        <button
          type="submit"
          className="w-full py-4 bg-white text-black font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
        >
          פרסם אירוע
        </button>
      </form>
    </div>
  );
}
