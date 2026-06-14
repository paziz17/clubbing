import { requireVenue } from "@/lib/venue-session";
import { Scanner } from "./scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  await requireVenue();
  return (
    <div className="crm-page-body">
      <div>
        <h1 className="font-display text-3xl text-ink">סריקת כניסה</h1>
        <p className="text-sm text-ink-muted">
          סרוק/י את ה-QR של הכרטיס בכניסה לאירוע — המערכת מאמתת שהכרטיס שולם ולא נוצל כבר.
        </p>
      </div>
      <Scanner />
    </div>
  );
}
