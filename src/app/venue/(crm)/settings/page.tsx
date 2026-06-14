import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const venue = await requireVenue();
  let settings = await db.venueSettings.findUnique({ where: { venueId: venue.id } });
  if (!settings) {
    settings = await db.venueSettings.create({
      data: {
        venueId: venue.id,
        creditRatePerTier: JSON.stringify({
          REGULAR: 0.02,
          SILVER: 0.03,
          GOLD: 0.04,
          PLATINUM: 0.05,
        }),
      },
    });
  }

  const tierCounts = await db.clubItCard.groupBy({
    by: ["tier"],
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  tierCounts.forEach((t) => (counts[t.tier] = t._count._all));

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">הגדרות · תוכנית קרדיטים</h1>
        <p className="text-sm text-ink-muted">
          הקצה אחוזים, ספים ותוקף — שינויים יחולו על כל הלקוחות הקיימים רטרואקטיבית.
        </p>
      </div>
      <SettingsForm
        settings={JSON.parse(JSON.stringify(settings))}
        tierCounts={counts}
      />
    </div>
  );
}
