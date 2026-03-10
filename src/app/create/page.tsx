"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function CreateEventPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
      <div className="min-h-screen flex flex-col">
        <Header showAuth showBack backHref="/results" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-violet-400 mb-4">Creating events is available for registered users only</p>
          <Link href="/auth" className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition">{t("nav.login")}</Link>
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
      <div className="min-h-screen flex flex-col">
        <Header showAuth showBack backHref="/results" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-white font-semibold mb-2">Event submitted for approval</p>
          <p className="text-violet-400 text-sm mb-6">You will be notified when the admin approves</p>
          <Link href="/results" className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition">← Back to events</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuth showBack backHref="/results" />
      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        <h1 className="font-heading text-3xl text-white mb-8">Add Event</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-violet-400 text-sm mb-2">Event name</label>
            <input
              type="text"
              placeholder="Event name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-violet-400 text-sm mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div className="w-32">
              <label className="block text-violet-400 text-sm mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-violet-400 text-sm mb-2">Location</label>
            <input
              type="text"
              placeholder="City / region"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-violet-400 text-sm mb-2">Address</label>
            <input
              type="text"
              placeholder="Full address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-violet-400 text-sm mb-2">Description</label>
            <textarea
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-violet-400 text-sm mb-2">Ticket link</label>
            <input
              type="url"
              placeholder="https://..."
              value={ticketLink}
              onChange={(e) => setTicketLink(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-violet-400 text-sm mb-2">Phone</label>
            <input
              type="tel"
              placeholder="Contact phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-violet-400 text-sm mb-2">Tags</label>
            <input
              type="text"
              placeholder="House, 21+, Rooftop (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a0f2e] border border-[#2d1b4e] rounded-lg text-white placeholder-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition"
          >
            Submit Event
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
