import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { parseCsv, parseJson } from "@/lib/enums";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Music2,
  Users,
  CalendarDays,
  Instagram,
  Youtube,
  ExternalLink,
  Radio,
} from "lucide-react";

export default async function VenueArtistsPage() {
  const venue = await requireVenue();
  const artists = await db.artist.findMany({
    where: { events: { some: { venueId: venue.id } } },
    include: {
      _count: { select: { followers: true, events: true } },
      events: {
        where: { venueId: venue.id },
        orderBy: { startsAt: "desc" },
        take: 1,
        select: { imageUrl: true, startsAt: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();

  return (
    <div className="crm-page-body">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">אומנים</h1>
          <p className="text-sm text-ink-muted">
            {artists.length} אומנים שהופיעו אצלי
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {artists.map((a) => {
          const links = parseJson<Record<string, string>>(a.links, {});
          const genres = parseCsv(a.genres);
          const coverImg = a.imageUrl ?? a.events[0]?.imageUrl ?? null;

          return (
            <Link key={a.id} href={`/venue/artists/${a.id}`}>
              <Card className="overflow-hidden hover:border-gold/30 transition-all hover:-translate-y-0.5 cursor-pointer h-full flex flex-col">
                {/* Cover photo */}
                <div className="relative h-40 bg-gradient-to-br from-gold/10 via-bg-soft to-bg flex-shrink-0">
                  {coverImg ? (
                    <img
                      src={coverImg}
                      alt={a.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music2 className="w-10 h-10 text-gold/20" />
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />

                  {/* Social quick links */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {links.instagram && (
                      <a
                        href={links.instagram}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                    {links.youtube && (
                      <a
                        href={links.youtube}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <Youtube className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                    {links.spotify && (
                      <a
                        href={links.spotify}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <Radio className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                  </div>

                  {/* View detail */}
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 text-[10px] text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                      <ExternalLink className="w-3 h-3" />
                      פרופיל
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <div className="font-semibold text-ink text-base leading-tight">{a.name}</div>
                    {genres.length > 0 && (
                      <div className="text-xs text-ink-muted mt-0.5">{genres.join(" · ")}</div>
                    )}
                  </div>

                  {/* Genre chips */}
                  {genres.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {genres.slice(0, 3).map((g) => (
                        <span key={g} className="chip text-[10px]">{g}</span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-ink-muted mt-auto pt-2 border-t border-line">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-gold" />
                      {a._count.followers} עוקבים
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-gold" />
                      {a._count.events} הופעות
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}

        {artists.length === 0 && (
          <Card className="col-span-3 p-16 text-center text-ink-muted">
            <Music2 className="w-10 h-10 text-gold/20 mx-auto mb-3" />
            <p>עדיין לא קושרו אומנים לאירועים אצלי</p>
          </Card>
        )}
      </div>
    </div>
  );
}
