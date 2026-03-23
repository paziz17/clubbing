"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ClubPage() {
  const params = useParams();
  const id = params.id as string;
  const [club, setClub] = useState<{
    id: string;
    name: string;
    location?: string;
    earnRate?: number;
    expirationDays?: number;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/clubs/${id}`)
      .then((r) => r.json())
      .then(setClub)
      .catch(console.error);
  }, [id]);

  if (!club) return <div className="p-8 text-zinc-500">טוען...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-zinc-800/50 px-4 py-3">
        <Link href="/" className="text-rose-500 hover:text-rose-400">
          ← חזרה
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">{club.name}</h1>
        {club.location && (
          <p className="text-zinc-500 mb-6">{club.location}</p>
        )}
        {club.earnRate && (
          <p className="text-zinc-400 text-sm mb-6">
            צבר {Math.round(club.earnRate * 100)}% קרדיטים על כל הוצאה • תוקף {club.expirationDays} יום
          </p>
        )}
        <Link
          href={`/clubs/${id}/pass`}
          className="block w-full py-4 bg-rose-600 hover:bg-rose-500 text-white text-center rounded-xl font-semibold text-lg"
        >
          סגור לי את הערב
        </Link>
      </main>
    </div>
  );
}
