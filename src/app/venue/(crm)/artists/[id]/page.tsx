import { notFound } from "next/navigation";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { parseCsv, parseJson } from "@/lib/enums";
import { formatDateHe, formatTimeHe } from "@/lib/utils";
import Link from "next/link";
import {
  Instagram,
  Music2,
  Youtube,
  Globe,
  Users,
  CalendarDays,
  MapPin,
  Clock,
  ArrowLeft,
  ExternalLink,
  Radio,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function CrmArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await requireVenue();

  const artist = await db.artist.findUnique({
    where: { id },
    include: {
      events: {
        where: { venueId: venue.id },
        orderBy: { startsAt: "desc" },
        take: 20,
      },
      _count: { select: { followers: true, events: true } },
    },
  });

  if (!artist) notFound();

  const links = parseJson<Record<string, string>>(artist.links, {});
  const genres = parseCsv(artist.genres);

  const now = new Date();
  const upcomingEvents = artist.events.filter((e) => e.startsAt >= now);
  const pastEvents = artist.events.filter((e) => e.startsAt < now);
  const totalRevenue = 0; // placeholder — could join reservations

  /* ── photos: collect imageUrl from events ── */
  const photos = artist.events
    .map((e) => e.imageUrl)
    .filter(Boolean)
    .slice(0, 4) as string[];
  if (artist.imageUrl && !photos.includes(artist.imageUrl)) {
    photos.unshift(artist.imageUrl);
  }

  return (
    <div className="crm-page-body max-w-6xl">
      {/* ── Back ── */}
      <Link
        href="/venue/artists"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-1"
      >
        <ArrowLeft className="w-4 h-4" />
        חזרה לאומנים
      </Link>

      {/* ══════════════════════════════════════════
          TOP HEADER — name + tabs
      ══════════════════════════════════════════ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl text-ink leading-tight">{artist.name}</h1>
          {genres.length > 0 && (
            <p className="text-ink-muted text-sm mt-1">{genres.join(" · ")}</p>
          )}
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-4 text-sm text-ink-muted mt-1">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gold" />
            <strong className="text-ink">{artist._count.followers}</strong> עוקבים
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-gold" />
            <strong className="text-ink">{artist._count.events}</strong> הופעות סה״כ
          </span>
          <span className="flex items-center gap-1.5">
            <Music2 className="w-4 h-4 text-gold" />
            <strong className="text-ink">{upcomingEvents.length}</strong> קרובות
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MAIN GRID — left info / right photos+events
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Photos mosaic */}
          {photos.length > 0 && (
            <div
              className={`grid gap-2 rounded-2xl overflow-hidden ${
                photos.length === 1 ? "grid-cols-1" :
                photos.length === 2 ? "grid-cols-2" :
                photos.length === 3 ? "grid-cols-3" :
                "grid-cols-4"
              }`}
              style={{ maxHeight: 260 }}
            >
              {photos.map((src, i) => (
                <div key={i} className="relative bg-bg-soft overflow-hidden">
                  <img
                    src={src}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    style={{ minHeight: 180, maxHeight: 260 }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* No photos fallback */}
          {photos.length === 0 && (
            <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-gold/10 via-bg-soft to-bg flex items-center justify-center">
              <Music2 className="w-12 h-12 text-gold/30" />
            </div>
          )}

          {/* ── External link cards (Instagram / YouTube / Spotify / SoundCloud / site) ── */}
          {Object.keys(links).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {links.instagram && (
                <a
                  href={links.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="card-elevated p-4 flex items-start gap-3 hover:border-gold/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-ink-muted">Instagram</div>
                    <div className="text-sm font-medium text-ink truncate">{artist.name}</div>
                    <div className="text-xs text-ink-muted truncate">{links.instagram.replace("https://", "")}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-ink-muted ml-auto flex-shrink-0 mt-0.5" />
                </a>
              )}

              {links.youtube && (
                <a
                  href={links.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="card-elevated p-4 flex items-start gap-3 hover:border-gold/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                    <Youtube className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-ink-muted">YouTube</div>
                    <div className="text-sm font-medium text-ink truncate">{artist.name}</div>
                    <div className="text-xs text-ink-muted truncate">{links.youtube.replace("https://", "")}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-ink-muted ml-auto flex-shrink-0 mt-0.5" />
                </a>
              )}

              {links.spotify && (
                <a
                  href={links.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="card-elevated p-4 flex items-start gap-3 hover:border-gold/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Radio className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-ink-muted">Spotify</div>
                    <div className="text-sm font-medium text-ink truncate">{artist.name}</div>
                    <div className="text-xs text-ink-muted truncate">{links.spotify.replace("https://", "")}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-ink-muted ml-auto flex-shrink-0 mt-0.5" />
                </a>
              )}

              {links.soundcloud && (
                <a
                  href={links.soundcloud}
                  target="_blank"
                  rel="noreferrer"
                  className="card-elevated p-4 flex items-start gap-3 hover:border-gold/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-ink-muted">SoundCloud</div>
                    <div className="text-sm font-medium text-ink truncate">{artist.name}</div>
                    <div className="text-xs text-ink-muted truncate">{links.soundcloud.replace("https://", "")}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-ink-muted ml-auto flex-shrink-0 mt-0.5" />
                </a>
              )}

              {links.website && (
                <a
                  href={links.website}
                  target="_blank"
                  rel="noreferrer"
                  className="card-elevated p-4 flex items-start gap-3 hover:border-gold/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-bg-soft border border-line flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-ink-muted" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-ink-muted">אתר</div>
                    <div className="text-sm font-medium text-ink truncate">{links.website.replace(/https?:\/\//, "")}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-ink-muted ml-auto flex-shrink-0 mt-0.5" />
                </a>
              )}
            </div>
          )}

          {/* ── מידע כללי ── */}
          <Card className="p-5">
            <h3 className="font-semibold text-ink mb-4 text-base">מידע כללי</h3>
            <div className="space-y-3">
              {artist.bio && (
                <p className="text-sm text-ink leading-relaxed">{artist.bio}</p>
              )}
              {genres.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-ink-muted w-24 text-left flex-shrink-0">ז׳אנרים</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {genres.map((g) => (
                      <span key={g} className="chip">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-muted w-24 text-left flex-shrink-0">הופעות אצלי</span>
                <span className="font-medium text-ink">{artist.events.length}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-muted w-24 text-left flex-shrink-0">עוקבים</span>
                <span className="font-medium text-ink">{artist._count.followers}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-muted w-24 text-left flex-shrink-0">פרופיל ציבורי</span>
                <Link
                  href={`/artists/${artist.slug}`}
                  target="_blank"
                  className="text-gold hover:underline text-sm inline-flex items-center gap-1"
                >
                  ↗ ply3rs.com/artists/{artist.slug}
                </Link>
              </div>
            </div>
          </Card>

          {/* ── הופעות קודמות ── */}
          {pastEvents.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink mb-3">הופעות קודמות אצלי</h3>
              <div className="space-y-2">
                {pastEvents.slice(0, 5).map((e) => (
                  <Link
                    key={e.id}
                    href={`/venue/events/${e.id}`}
                    className="card-elevated p-3 flex items-center justify-between hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {e.imageUrl ? (
                        <img src={e.imageUrl} alt={e.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-bg-soft flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-4 h-4 text-ink-muted" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-ink text-sm">{e.name}</div>
                        <div className="text-xs text-ink-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateHe(e.startsAt)} · {formatTimeHe(e.startsAt)}
                        </div>
                      </div>
                    </div>
                    <span className="text-gold text-sm">←</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN — upcoming events ── */}
        <div className="space-y-5">
          {/* Upcoming events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-gold" />
                  אירועים קרובים
                </span>
              </h3>
              {upcomingEvents.length > 0 && (
                <span className="text-xs text-gold">{upcomingEvents.length} אירועים</span>
              )}
            </div>

            {upcomingEvents.length === 0 ? (
              <Card className="p-6 text-center text-sm text-ink-muted">
                אין הופעות קרובות מתוכננות
              </Card>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((e) => {
                  const d = e.startsAt;
                  const day = d.toLocaleDateString("he-IL", { day: "numeric" });
                  const month = d.toLocaleDateString("he-IL", { month: "short" });
                  return (
                    <Link
                      key={e.id}
                      href={`/venue/events/${e.id}`}
                      className="card-elevated p-3 flex items-center gap-3 hover:border-gold/40 transition-colors"
                    >
                      {/* Date badge */}
                      <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-gold uppercase leading-none">{month}</span>
                        <span className="text-lg font-bold text-ink leading-none">{day}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-ink text-sm truncate">{e.name}</div>
                        <div className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTimeHe(e.startsAt)}
                        </div>
                        {e.status && (
                          <span className={`text-[10px] mt-0.5 inline-block px-1.5 py-0.5 rounded-full ${
                            e.status === "PUBLISHED" ? "bg-green-500/10 text-green-400" : "bg-bg-soft text-ink-muted"
                          }`}>
                            {e.status === "PUBLISHED" ? "פורסם" : e.status === "DRAFT" ? "טיוטה" : e.status}
                          </span>
                        )}
                      </div>
                      <span className="text-gold text-sm mr-auto">←</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats mini cards */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-4 text-center">
              <div className="text-2xl font-display text-gold">{artist._count.followers}</div>
              <div className="text-xs text-ink-muted mt-0.5">עוקבים</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-display text-gold">{artist.events.length}</div>
              <div className="text-xs text-ink-muted mt-0.5">הופעות אצלי</div>
            </Card>
            <Card className="p-4 text-center col-span-2">
              <div className="text-2xl font-display text-gold">{upcomingEvents.length}</div>
              <div className="text-xs text-ink-muted mt-0.5">הופעות קרובות</div>
            </Card>
          </div>

          {/* Public profile link */}
          <Link
            href={`/artists/${artist.slug}`}
            target="_blank"
            className="card-elevated p-4 flex items-center gap-3 hover:border-gold/40 transition-colors text-sm"
          >
            <Globe className="w-5 h-5 text-gold flex-shrink-0" />
            <div>
              <div className="font-medium text-ink">פרופיל ציבורי</div>
              <div className="text-xs text-ink-muted">צפה בדף הציבורי של האומן</div>
            </div>
            <ExternalLink className="w-4 h-4 text-ink-muted mr-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
}
