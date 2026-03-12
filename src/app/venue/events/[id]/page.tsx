"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Reservation {
  id: string;
  numPeople: number;
  phone: string;
  email: string;
  createdAt: string;
}

interface EventDetail {
  id: string;
  name: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string;
  address: string | null;
  phone: string | null;
  imageUrl: string | null;
  status: string;
  reservations: Reservation[];
}

export default function VenueEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/venue/events/${id}`)
      .then((r) => {
        if (r.status === 401) {
          router.replace("/venue/login");
          return null;
        }
        return r.json();
      })
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#d4af37]">אירוע לא נמצא</p>
      </div>
    );
  }

  const totalPeople = event.reservations.reduce((s, r) => s + r.numPeople, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/venue" className="text-zinc-500 text-sm hover:text-white mb-6 inline-block">
          ← חזרה ל-CRM
        </Link>

        <div className="bg-[#111111] border border-[#d4af37]/30 rounded-2xl overflow-hidden mb-8">
          {event.imageUrl && (
            <div className="aspect-video bg-[#111111] border border-[#d4af37]/20">
              <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-2">{event.name}</h1>
            <div className="flex flex-wrap gap-4 text-zinc-400 text-sm mb-4">
              <span>📅 {new Date(event.date).toLocaleDateString("he-IL")} • {event.time}</span>
              <span>📍 {event.address || event.location}</span>
              {event.phone && <span>📞 {event.phone}</span>}
            </div>
            {event.description && <p className="text-zinc-500 text-sm mb-4">{event.description}</p>}
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-[#111111] border border-[#d4af37]/20 rounded-lg">
                <span className="text-zinc-500 text-xs">הזמנות</span>
                <p className="text-white font-bold">{event.reservations.length}</p>
              </div>
              <div className="px-4 py-2 bg-[#111111] border border-[#d4af37]/20 rounded-lg">
                <span className="text-zinc-500 text-xs">אנשים</span>
                <p className="text-white font-bold">{totalPeople}</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-4">פרטי ההזמנות</h2>
        {event.reservations.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">אין הזמנות עדיין</p>
        ) : (
          <div className="bg-[#111111] border border-[#d4af37]/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-[#d4af37]/20">
                    <th className="px-4 py-3 text-zinc-500 text-sm font-medium">תאריך</th>
                    <th className="px-4 py-3 text-zinc-500 text-sm font-medium">טלפון</th>
                    <th className="px-4 py-3 text-zinc-500 text-sm font-medium">מייל</th>
                    <th className="px-4 py-3 text-zinc-500 text-sm font-medium">אנשים</th>
                  </tr>
                </thead>
                <tbody>
                  {event.reservations.map((r) => (
                    <tr key={r.id} className="border-b border-[#d4af37]/20 last:border-0">
                      <td className="px-4 py-3 text-zinc-300 text-sm">
                        {new Date(r.createdAt).toLocaleString("he-IL")}
                      </td>
                      <td className="px-4 py-3 text-white">
                        <a href={`tel:${r.phone}`} className="hover:text-[#d4af37]">
                          {r.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-white">
                        <a href={`mailto:${r.email}`} className="hover:text-[#d4af37]">
                          {r.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-[#d4af37] font-medium">{r.numPeople}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
