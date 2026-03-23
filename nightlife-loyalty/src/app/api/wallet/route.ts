import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { calculateBalance, getExpiringCredits } from "@/lib/credit";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "טוקן לא תקף" }, { status: 401 });
  }

  const clubId = req.nextUrl.searchParams.get("club_id");
  if (!clubId) {
    return NextResponse.json({ error: "club_id נדרש" }, { status: 400 });
  }

  const balance = await calculateBalance(payload.userId, clubId);
  const expiring = await getExpiringCredits(payload.userId, clubId, 7);

  const expiringTotal = expiring.reduce((s, e) => s + e.amount, 0);
  const nearestExpiry = expiring[0]?.expirationDate;

  return NextResponse.json({
    balance,
    expiringSoon: expiringTotal,
    expiringDate: nearestExpiry?.toISOString(),
  });
}
