import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { timeAgoHe } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SelectionActions } from "./actions";

export default async function SelectionPage() {
  const venue = await requireVenue();
  const apps = await db.exclusiveApplication.findMany({
    where: { venueId: venue.id },
    include: { user: true, event: true },
    orderBy: { appliedAt: "desc" },
  });

  const pending = apps.filter((a) => a.status === "PENDING");

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">סלקציה · Exclusive Club</h1>
        <p className="text-sm text-ink-muted">
          {pending.length} בקשות ממתינות · {apps.length} סה״כ
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs text-ink-muted uppercase tracking-wider">ממתינים</div>
          <div className="font-display text-3xl text-warn">{pending.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-ink-muted uppercase tracking-wider">אושרו</div>
          <div className="font-display text-3xl text-success">
            {apps.filter((a) => a.status === "APPROVED").length}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-ink-muted uppercase tracking-wider">נדחו</div>
          <div className="font-display text-3xl text-danger">
            {apps.filter((a) => a.status === "REJECTED").length}
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {apps.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-display text-xl">
                  {a.snapshotName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-ink">{a.snapshotName}</div>
                  <div className="text-xs text-ink-muted mt-1">
                    {a.snapshotAge ? `${a.snapshotAge} · ` : ""}
                    {a.snapshotCity ?? "—"} · {a.event?.name}
                  </div>
                  {a.snapshotInstagram && (
                    <a
                      href={`https://instagram.com/${a.snapshotInstagram.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gold hover:underline mt-1 inline-block"
                    >
                      @{a.snapshotInstagram.replace("@", "")}
                    </a>
                  )}
                  <div className="text-xs text-ink-dim mt-2">{timeAgoHe(a.appliedAt)}</div>
                  {a.rejectionReason && (
                    <p className="text-xs text-danger mt-2">סיבת דחייה: {a.rejectionReason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                {a.status === "PENDING" && <SelectionActions appId={a.id} />}
              </div>
            </div>
          </Card>
        ))}
        {apps.length === 0 && (
          <Card className="p-12 text-center text-ink-muted">אין בקשות סלקציה כרגע</Card>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    PENDING: { variant: "warn", label: "ממתין" },
    APPROVED: { variant: "success", label: "אושר" },
    REJECTED: { variant: "danger", label: "נדחה" },
    EXPIRED: { variant: "default", label: "פג" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
