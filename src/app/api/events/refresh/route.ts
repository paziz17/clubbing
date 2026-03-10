import { NextResponse } from "next/server";
import { runSeed } from "../../../../../prisma/seed";
import { syncFacebookEvents } from "@/lib/sync-facebook";

// רענון הנתונים — seed + סנכרון Facebook (אם מוגדר)
export async function POST() {
  try {
    await runSeed();
    let fbMsg = "";
    const fb = await syncFacebookEvents();
    if (fb.synced > 0) fbMsg = ` | Facebook: ${fb.synced} אירועים`;
    if (fb.errors.length) fbMsg += " (חלק נכשלו)";
    return NextResponse.json({ success: true, message: `נתונים עודכנו${fbMsg}` });
  } catch (e) {
    console.error("Refresh failed:", e);
    return NextResponse.json(
      { error: "שגיאה ברענון הנתונים" },
      { status: 500 }
    );
  }
}
