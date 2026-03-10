import { NextResponse } from "next/server";
import { syncFacebookEvents } from "@/lib/sync-facebook";

// סנכרון אירועים מ-Facebook
// דורש: FACEBOOK_ACCESS_TOKEN, FACEBOOK_PAGE_IDS (מופרדים בפסיק) ב-.env
// Instagram: אין API ציבורי לאירועים — לא נתמך כרגע
export async function POST() {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageIds = process.env.FACEBOOK_PAGE_IDS?.split(",").map((s) => s.trim()).filter(Boolean);

  if (!token || !pageIds?.length) {
    return NextResponse.json(
      {
        error: "חסר הגדרה. הוסף FACEBOOK_ACCESS_TOKEN ו-FACEBOOK_PAGE_IDS ל-.env",
        hint: "קבל token מ-Graph API Explorer, הוסף מזהה דפים (לדוגמה: 123456789)",
      },
      { status: 400 }
    );
  }

  const { synced, errors } = await syncFacebookEvents();
  return NextResponse.json({
    success: true,
    synced,
    errors: errors.length ? errors : undefined,
  });
}
