import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateHe, formatTimeHe, formatILS, calculateAge } from "@/lib/utils";
import { parseCsv } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, Sparkles } from "lucide-react";
import { TaxiButtons } from "@/components/taxi-buttons";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: {
      venue: true,
      tickets: { where: { active: true } },
      artist: true,
    },
  });
  if (!event) notFound();

  const expectedCredits = Math.round(event.basePriceAgorot * 0.02);

  return (
    <div className="mobile-screen pb-32 overflow-y-auto">
      {/* CLUBBING top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-bg/80 backdrop-blur-md border-b border-gold/10">
        <Link href="/results" className="text-gold/70 hover:text-gold text-sm">
          ← חזרה
        </Link>
        <span className="font-display text-lg text-gold-gradient tracking-[0.35em]">
          CLUBBING
        </span>
        <div className="w-12" />
      </div>

      {/* Hero */}
      <div
        className="aspect-[16/10] bg-gradient-to-br from-purple-900/40 via-bg to-bg relative"
        style={{
          backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="absolute bottom-0 right-0 left-0 p-5">
          <h1 className="font-display text-3xl text-ink mb-1">{event.name}</h1>
          <div className="flex items-center gap-3 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateHe(event.startsAt)}
            </span>
            <span>·</span>
            <span>{formatTimeHe(event.startsAt)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6 pt-6">
        {/* venue */}
        <div className="card-elevated p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gold mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-ink">{event.venue.name}</div>
              <div className="text-sm text-ink-muted">{event.venue.address}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h3 className="text-sm text-ink-muted mb-2">על האירוע</h3>
            <p className="text-ink leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Artist (Part IV) */}
        {event.artist && (
          <Link
            href={`/artists/${event.artist.slug}`}
            className="card-elevated p-4 flex items-center gap-4 hover:border-gold/40 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-ink-muted">מופיע/ים</div>
              <div className="font-semibold text-ink">{event.artist.name}</div>
            </div>
            <span className="text-gold text-sm">דף האומן ←</span>
          </Link>
        )}

        {/* tags */}
        <div className="flex flex-wrap gap-2">
          {parseCsv(event.genres).map((g) => (
            <Badge key={g} variant="gold">{g}</Badge>
          ))}
          {event.type && <Badge>{event.type}</Badge>}
        </div>

        {/* Club-it banner */}
        <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/15 to-gold/5 p-5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✨</div>
            <div className="flex-1">
              <div className="font-semibold text-gold mb-1">
                שלם/י עם Club-it וקבל/י +{expectedCredits} קרדיטים
              </div>
              <div className="text-xs text-ink-muted">
                כל בילוי מתורגם לזיכוי חוזר. הצטרפות חינמית.
              </div>
            </div>
          </div>
        </div>

        {/* Taxi buttons */}
        <TaxiButtons
          venueLat={event.venue.lat ?? event.lat ?? undefined}
          venueLng={event.venue.lng ?? event.lng ?? undefined}
          venueName={event.venue.name}
          mode="to-venue"
        />
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 right-0 left-0 z-30 glass border-t border-line p-4 max-w-md mx-auto">
        <Link href={`/events/${event.id}/checkout`} className="btn-gold w-full h-12">
          הזמן/י כרטיס · {formatILS(event.basePriceAgorot)} ←
        </Link>
      </div>
    </div>
  );
}
