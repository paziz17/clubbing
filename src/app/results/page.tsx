import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { formatDateHe, formatTimeHe, formatILS } from "@/lib/utils";
import { parseCsv } from "@/lib/enums";
import { Pencil, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

// Maps a discover-wizard genre id to the genre tokens that may appear on an
// event's `genres` CSV (mixed Hebrew/English). Used for soft matching.
const GENRE_ALIASES: Record<string, string[]> = {
  pub_rock: ["rock", "blues", "פאב", "פאב/רוק"],
  lounge: ["lounge", "chill", "chillout", "לאונג'"],
  nature: ["nature", "טבע", "trance", "טראנס"],
  mizrahi: ["מזרחית", "ים-תיכוני", "ים תיכוני", "mizrahi"],
  hiphop: ["hip-hop", "hiphop", "hip hop", "rap", "ראפ", "היפ הופ"],
  pop: ["pop", "פופ"],
  "80s": ["80s", "retro", "רטרו", "שנות ה-80"],
  techno: ["techno", "house", "electronic", "edm", "טכנו"],
};

function timingRange(timing?: string): { gte: Date; lte?: Date } {
  const now = new Date();
  if (timing === "tonight") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { gte: now, lte: end };
  }
  if (timing === "week") {
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    return { gte: now, lte: end };
  }
  if (timing === "weekend") {
    // Next Friday 00:00 → Saturday 23:59 (Israeli weekend)
    const start = new Date(now);
    const day = start.getDay(); // 0=Sun … 5=Fri 6=Sat
    const daysUntilFri = (5 - day + 7) % 7;
    start.setDate(start.getDate() + daysUntilFri);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1); // Saturday
    end.setHours(23, 59, 59, 999);
    return { gte: start < now ? now : start, lte: end };
  }
  return { gte: now };
}

export default async function ResultsPage({ searchParams }: Props) {
  const params = await searchParams;

  // Fetch a generous window of upcoming published events, then filter
  // in-memory. Filters are applied defensively: if a filter eliminates
  // every result we fall back to the broader list so the user never lands
  // on an empty screen because of data/label mismatches.
  const range = timingRange(params.timing);
  const allUpcoming = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { gte: new Date() },
    },
    include: { venue: true },
    orderBy: { startsAt: "asc" },
    take: 100,
  });

  // Timing filter (with fallback)
  const byTiming = allUpcoming.filter(
    (e) => e.startsAt >= range.gte && (!range.lte || e.startsAt <= range.lte)
  );
  let events = byTiming.length > 0 ? byTiming : allUpcoming;

  // Genre filter (soft, with fallback)
  const selectedGenres = (params.genres?.split(",") ?? []).filter(Boolean);
  if (selectedGenres.length > 0) {
    const tokens = selectedGenres.flatMap(
      (id) => GENRE_ALIASES[id] ?? [id]
    ).map((t) => t.toLowerCase());
    const byGenre = events.filter((e) => {
      const g = (e.genres ?? "").toLowerCase();
      return tokens.some((t) => g.includes(t));
    });
    if (byGenre.length > 0) events = byGenre;
  }

  events = events.slice(0, 30);

  const vibe = [
    "🌙",
    params.area === "tel-aviv" ? "לילה תל־אביבי" : "לילה",
    params.genres?.split(",")[0],
    params.age,
    params.type === "PARTY" ? "מסיבה" : params.type,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mobile-screen pb-24">
      <div className="sticky top-0 z-10 glass border-b border-line px-4 py-3 flex items-center justify-between">
        <Link
          href="/discover"
          aria-label="חזור לבחירת מסיבה"
          className="inline-flex items-center gap-1 text-sm text-gold/80 hover:text-gold"
        >
          <ArrowRight className="w-4 h-4" /> חזור
        </Link>
        <div className="text-xs text-ink-muted flex-1 text-center px-2 truncate">{vibe}</div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
        >
          <Pencil className="w-3 h-3" /> ערוך
        </Link>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block rounded-xl overflow-hidden border border-line bg-bg-card hover:border-gold/40 transition-colors"
            >
              <div
                className="aspect-[16/10] bg-gradient-to-br from-purple-900/40 via-bg to-bg relative"
                style={{
                  backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-4">
                  <h3 className="font-display text-xl text-ink mb-1">{event.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <MapPin className="w-3 h-3" />
                    {event.venue.name}
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {parseCsv(event.genres).slice(0, 2).map((g) => (
                    <Badge key={g} variant="gold">{g}</Badge>
                  ))}
                  <Badge>+21</Badge>
                </div>
                <div className="text-right">
                  <div className="text-xs text-ink-muted">
                    {formatDateHe(event.startsAt)} · {formatTimeHe(event.startsAt)}
                  </div>
                  <div className="text-gold font-semibold">
                    {formatILS(event.basePriceAgorot)}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 px-4">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-xl text-ink mb-2">לא נמצאו אירועים</h3>
      <p className="text-sm text-ink-muted mb-6">
        נסה/י להרחיב את החיפוש או חזור/י לאשף
      </p>
      <Link href="/discover" className="btn-gold inline-flex">
        חזור לאשף ←
      </Link>
    </div>
  );
}
