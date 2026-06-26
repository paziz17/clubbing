import { NextRequest, NextResponse } from "next/server";

/**
 * Promoter tracking link: /r/<promoterCode>?e=<eventId>
 * Stores the attribution in a cookie and redirects to the event page.
 * Checkout reads the cookie and credits the sale + commission to the promoter.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const url = new URL(req.url);
  const eventId = url.searchParams.get("e") ?? "";

  const dest = eventId ? `/events/${eventId}` : "/";
  const res = NextResponse.redirect(new URL(dest, url.origin));

  if (code && eventId) {
    res.cookies.set("clubbing_ref", `${eventId}:${code}`, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
