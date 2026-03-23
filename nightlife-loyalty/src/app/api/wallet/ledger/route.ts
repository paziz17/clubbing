import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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

  const entries = await prisma.creditLedger.findMany({
    where: { userId: payload.userId, clubId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    entries.map((e) => ({
      id: e.id,
      type: e.type,
      amount: e.amount,
      expirationDate: e.expirationDate?.toISOString(),
      createdAt: e.createdAt.toISOString(),
    }))
  );
}
