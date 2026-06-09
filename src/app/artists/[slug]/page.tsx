import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateHe, formatTimeHe } from "@/lib/utils";
import { parseCsv, parseJson } from "@/lib/enums";
import Link from "next/link";
import { Instagram, Music2 } from "lucide-react";
import { FollowButton } from "./follow-button";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = await db.artist.findUnique({
    where: { slug },
    include: {
      events: {
        where: { startsAt: { gte: new Date() }, status: "PUBLISHED" },
        include: { venue: true },
        orderBy: { startsAt: "asc" },
      },
      _count: { select: { followers: true } },
    },
  });
  if (!artist) notFound();

  const links = parseJson<Record<string, string>>(artist.links, {});
  const genres = parseCsv(artist.genres);

  return (
    <div className="mobile-screen pb-10">
      <div className="aspect-square bg-gradient-to-br from-purple-900/40 via-bg to-bg relative">
        {artist.imageUrl && (
          <img src={artist.imageUrl} alt={artist.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        <div className="absolute bottom-0 right-0 left-0 p-5">
          <h1 className="font-display text-4xl text-ink mb-1">{artist.name}</h1>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>{artist._count.followers} עוקבים</span>
            {genres.length > 0 && <span>· {genres.join(" · ")}</span>}
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        <FollowButton artistId={artist.id} />

        {artist.bio && <p className="text-sm text-ink leading-relaxed">{artist.bio}</p>}

        {/* external links */}
        <div className="grid grid-cols-4 gap-2">
          {links.instagram && (
            <a href={links.instagram} target="_blank" rel="noreferrer" className="btn-ghost h-10 text-xs">
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
          )}
          {links.spotify && (
            <a href={links.spotify} target="_blank" rel="noreferrer" className="btn-ghost h-10 text-xs">
              Spotify
            </a>
          )}
          {links.soundcloud && (
            <a href={links.soundcloud} target="_blank" rel="noreferrer" className="btn-ghost h-10 text-xs">
              SoundCloud
            </a>
          )}
          {links.youtube && (
            <a href={links.youtube} target="_blank" rel="noreferrer" className="btn-ghost h-10 text-xs">
              YouTube
            </a>
          )}
        </div>

        <section>
          <h3 className="font-semibold text-ink mb-3">הופעות קרובות</h3>
          <div className="space-y-2">
            {artist.events.length === 0 ? (
              <p className="text-sm text-ink-muted">אין הופעות מתוכננות. עקוב כדי לקבל התראה.</p>
            ) : (
              artist.events.map((e) => (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="card-elevated p-3 flex items-center justify-between hover:border-gold/40"
                >
                  <div>
                    <div className="font-semibold text-ink text-sm">{e.name}</div>
                    <div className="text-xs text-ink-muted">
                      {e.venue.name} · {formatDateHe(e.startsAt)} · {formatTimeHe(e.startsAt)}
                    </div>
                  </div>
                  <span className="text-gold text-sm">←</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
