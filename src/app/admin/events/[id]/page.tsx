"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingGlassPanel, clubingMutedLink } from "@/lib/clubing-ui";

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

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then((r) => {
        if (r.status === 401) {
          router.replace("/admin/login");
          return null;
        }
        return r.json();
      })
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      </ClubingPageShell>
    );
  }

  if (!event) {
    return (
      <ClubingPageShell contentClassName="flex min-h-screen items-center justify-center">
        <p className="text-[#e8c96b]">אירוע לא נמצא</p>
      </ClubingPageShell>
    );
  }

  const totalPeople = event.reservations.reduce((s, r) => s + r.numPeople, 0);

  return (
    <ClubingPageShell contentClassName="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className={`mb-6 inline-block text-sm ${clubingMutedLink}`}>
          ← חזרה ל-CRM
        </Link>

        <div className={`mb-8 overflow-hidden ${clubingGlassPanel}`}>
          {event.imageUrl && (
            <div className="aspect-video border-b border-[#d4af37]/20 bg-zinc-950">
              <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <ClubingHeading size="lg" className="mb-2 block">
              {event.name}
            </ClubingHeading>
            <div className="flex flex-wrap gap-4 text-zinc-400 text-sm mb-4">
              <span>📅 {new Date(event.date).toLocaleDateString("he-IL")} • {event.time}</span>
              <span>📍 {event.address || event.location}</span>
              {event.phone && <span>📞 {event.phone}</span>}
            </div>
            {event.description && (
              <p className="text-zinc-500 text-sm mb-4">{event.description}</p>
            )}
            <div className="flex gap-4">
              <div className="rounded-lg border border-[#d4af37]/25 bg-black/40 px-4 py-2">
                <span className="text-xs text-zinc-500">הזמנות</span>
                <p className="font-bold text-white">{event.reservations.length}</p>
              </div>
              <div className="rounded-lg border border-[#d4af37]/25 bg-black/40 px-4 py-2">
                <span className="text-xs text-zinc-500">אנשים</span>
                <p className="font-bold text-white">{totalPeople}</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-gradient-gold">פרטי ההזמנות</h2>
        {event.reservations.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">אין הזמנות עדיין</p>
        ) : (
          <div className={`overflow-hidden ${clubingGlassPanel}`}>
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
    </ClubingPageShell>
  );
}
