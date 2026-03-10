"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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

  if (!user || user?.isGuest) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header showAuth showBack backHref="/results" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-gray-600 mb-4">יצירת אירוע זמינה למשתמשים רשומים בלבד</p>
          <Link href="/auth" className="px-6 py-3 bg-[#f05537] hover:bg-[#e04a2d] text-white rounded-md font-medium transition">התחבר</Link>
        </div>
        <Footer />
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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header showAuth showBack backHref="/results" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-gray-900 font-semibold mb-2">האירוע נשלח לאישור</p>
          <p className="text-gray-600 text-sm mb-6">תקבל עדכון כשהמנהל יאשר</p>
          <Link href="/results" className="px-6 py-3 bg-[#f05537] hover:bg-[#e04a2d] text-white rounded-md font-medium transition">← חזרה לאירועים</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showAuth showBack backHref="/results" />
      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        <h1 className="font-heading text-3xl text-gray-900 mb-8">צור אירוע</h1>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-lg border border-gray-200">
          <div>
            <label className="block text-gray-700 text-sm mb-2">שם האירוע</label>
            <input type="text" placeholder="שם האירוע" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm mb-2">תאריך</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
            </div>
            <div className="w-32">
              <label className="block text-gray-700 text-sm mb-2">שעה</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">מיקום</label>
            <input type="text" placeholder="עיר / אזור" value={location} onChange={(e) => setLocation(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">כתובת</label>
            <input type="text" placeholder="כתובת מלאה" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">תיאור</label>
            <textarea placeholder="תיאור קצר" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537] resize-none" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">קישור לכרטיסים</label>
            <input type="url" placeholder="https://..." value={ticketLink} onChange={(e) => setTicketLink(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">טלפון</label>
            <input type="tel" placeholder="טלפון לתקשורת" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">תיוגים</label>
            <input type="text" placeholder="House, 21+, Rooftop (מופרדים בפסיק)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[#f05537] focus:border-[#f05537]" />
          </div>
          <button type="submit" className="w-full py-4 bg-[#f05537] hover:bg-[#e04a2d] text-white font-semibold rounded-md transition">
            פרסם אירוע
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
