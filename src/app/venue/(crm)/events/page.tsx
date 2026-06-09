import Link from "next/link";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { formatILS, formatDateHe, formatTimeHe } from "@/lib/utils";
import { parseCsv } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CreateEventButton } from "./create-event-button";

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function EventsPage({ searchParams }: Props) {
  const { filter = "all" } = await searchParams;
  const venue = await requireVenue();

  const where: any = { venueId: venue.id };
  const now = new Date();
  if (filter === "upcoming") where.startsAt = { gte: now };
  else if (filter === "ended") where.startsAt = { lt: now };

  const events = await db.event.findMany({
    where,
    orderBy: { startsAt: "desc" },
    include: {
      _count: { select: { reservations: true } },
      reservations: { select: { quantity: true, totalAgorot: true, status: true } },
    },
  });

  return (
    <div className="crm-page-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">אירועים</h1>
          <p className="text-sm text-ink-muted">{events.length} אירועים</p>
        </div>
        <CreateEventButton />
      </div>

      <div className="flex items-center gap-2">
        <FilterTab href="/venue/events?filter=all" active={filter === "all"}>הכל</FilterTab>
        <FilterTab href="/venue/events?filter=upcoming" active={filter === "upcoming"}>עתידיים</FilterTab>
        <FilterTab href="/venue/events?filter=ended" active={filter === "ended"}>הסתיימו</FilterTab>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft border-b border-line">
            <tr className="text-right text-xs text-ink-muted uppercase tracking-wider">
              <th className="px-5 py-3">אירוע</th>
              <th className="px-5 py-3">תאריך · שעה</th>
              <th className="px-5 py-3">סטטוס</th>
              <th className="px-5 py-3">הזמנות · אנשים</th>
              <th className="px-5 py-3">מחיר</th>
              <th className="px-5 py-3 text-left">הכנסה</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {events.map((e) => {
              const paid = e.reservations.filter((r) => r.status === "PAID");
              const revenue = paid.reduce((s, r) => s + r.totalAgorot, 0);
              const people = paid.reduce((s, r) => s + r.quantity, 0);
              return (
                <tr
                  key={e.id}
                  className="hover:bg-bg-soft transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <Link href={`/venue/events/${e.id}`} className="block">
                      <div className="font-semibold text-ink">{e.name}</div>
                      <div className="flex gap-1 mt-1">
                        {parseCsv(e.genres).slice(0, 2).map((g) => (
                          <span key={g} className="text-[10px] text-ink-muted">#{g}</span>
                        ))}
                        {parseCsv(e.tags).slice(0, 1).map((t) => (
                          <span key={t} className="text-[10px] text-ink-muted">·{t}</span>
                        ))}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">
                    {formatDateHe(e.startsAt)} · {formatTimeHe(e.startsAt)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={e.status} />
                  </td>
                  <td className="px-5 py-3 text-ink">
                    {paid.length} · {people}
                  </td>
                  <td className="px-5 py-3 text-ink">{formatILS(e.basePriceAgorot)}</td>
                  <td className="px-5 py-3 text-left">
                    <span className="text-gold font-display">{formatILS(revenue)}</span>
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-ink-muted">
                  אין אירועים. צור אירוע ראשון →
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function FilterTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
        active
          ? "bg-gold/15 text-gold border border-gold/40"
          : "bg-bg-soft text-ink-muted border border-line hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    PUBLISHED: { label: "פעיל", variant: "success" },
    DRAFT: { label: "טיוטה", variant: "warn" },
    ENDED: { label: "הסתיים", variant: "default" },
  };
  const cfg = map[status] ?? map.DRAFT;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
