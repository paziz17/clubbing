"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingGlassCard, clubingGoldCta, clubingInput, clubingMutedLink } from "@/lib/clubing-ui";

const input = clubingInput;
const textareaClass = `${clubingInput} resize-none`;

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
      <ClubingPageShell contentClassName="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-zinc-400">יצירת אירוע זמינה למשתמשים רשומים בלבד</p>
        <Link href="/auth" className="font-medium text-[#e8c96b] hover:text-[#f0d78c]">
          התחבר
        </Link>
      </ClubingPageShell>
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
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        createdById: user?.isDeveloper ? undefined : user?.id,
      }),
    });
    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 text-2xl">✅</p>
        <p className="mb-2 font-semibold text-white">האירוע נשלח לאישור</p>
        <p className="mb-6 text-sm text-zinc-500">תקבל עדכון כשהמנהל יאשר</p>
        <Link href="/results" className="font-medium text-[#e8c96b] transition hover:text-[#f0d78c]">
          חזרה לאירועים
        </Link>
      </ClubingPageShell>
    );
  }

  return (
    <ClubingPageShell contentClassName="px-6 py-8">
      <Link href="/results" className={`mb-6 inline-block text-sm ${clubingMutedLink}`}>
        ← חזרה
      </Link>
      <ClubingHeading size="lg" className="mb-8">
        יצירת אירוע
      </ClubingHeading>

      <form onSubmit={handleSubmit} className={`mx-auto max-w-lg space-y-4 p-6 ${clubingGlassCard}`}>
        <input
          type="text"
          placeholder="שם האירוע"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={input}
        />
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={`flex-1 ${input}`} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`w-36 ${input}`} />
        </div>
        <input
          type="text"
          placeholder="מיקום"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className={input}
        />
        <input
          type="text"
          placeholder="כתובת"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={input}
        />
        <textarea
          placeholder="תיאור קצר"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={textareaClass}
        />
        <input
          type="url"
          placeholder="קישור לרכישת כרטיסים / RSVP"
          value={ticketLink}
          onChange={(e) => setTicketLink(e.target.value)}
          className={input}
        />
        <input
          type="tel"
          placeholder="טלפון לתקשורת"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={input}
        />
        <input
          type="text"
          placeholder="תיוגים (מופרדים בפסיק): House, 21+, Rooftop"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={input}
        />
        <button type="submit" className={clubingGoldCta}>
          פרסם אירוע
        </button>
      </form>
    </ClubingPageShell>
  );
}
