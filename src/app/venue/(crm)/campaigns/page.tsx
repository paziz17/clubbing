import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { formatDateHe, timeAgoHe } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignComposer } from "./composer";

export default async function CampaignsPage() {
  const venue = await requireVenue();
  const campaigns = await db.campaign.findMany({
    where: { venueId: venue.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">Club Bot · WhatsApp</h1>
        <p className="text-sm text-ink-muted">
          שלח/י הודעות ממוקדות לחברי המועדון.{" "}
          {!isWhatsAppConfigured() && (
            <span className="text-warn">
              · WhatsApp API לא מחובר — הודעות ישלחו דרך קישורי wa.me
            </span>
          )}
        </p>
      </div>

      <CampaignComposer venueId={venue.id} />

      <Card className="p-5 overflow-hidden">
        <h2 className="font-semibold text-ink mb-3">היסטוריית קמפיינים</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-ink-muted uppercase tracking-wider">
            <tr className="text-right border-b border-line">
              <th className="py-2">תבנית</th>
              <th className="py-2">קהל יעד</th>
              <th className="py-2">נמענים</th>
              <th className="py-2">נשלחו</th>
              <th className="py-2">סטטוס</th>
              <th className="py-2 text-left">זמן</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-ink-muted">
                  עוד אין קמפיינים
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 text-ink">{c.kind}</td>
                  <td className="py-3 text-ink-muted">{c.audience}</td>
                  <td className="py-3 text-ink">{c.recipients}</td>
                  <td className="py-3 text-emerald-400">{c.delivered}</td>
                  <td className="py-3">
                    <Badge variant={c.status === "SENT" ? "success" : "default"}>{c.status}</Badge>
                  </td>
                  <td className="py-3 text-ink-muted text-left">{timeAgoHe(c.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
