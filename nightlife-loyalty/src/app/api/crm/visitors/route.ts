import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get("club_id");
  const date = req.nextUrl.searchParams.get("date");

  if (!clubId) {
    return NextResponse.json({ error: "club_id נדרש" }, { status: 400 });
  }

  const startOfDay = date
    ? new Date(date + "T00:00:00")
    : new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const visits = await prisma.visit.findMany({
    where: {
      clubId,
      checkInTime: { gte: startOfDay, lt: endOfDay },
    },
    include: { user: { select: { id: true, name: true, profilePhotoUrl: true } } },
    orderBy: { checkInTime: "desc" },
  });

  return NextResponse.json(
    visits.map((v) => ({
      id: v.id,
      userId: v.userId,
      userName: v.user.name,
      profilePhotoUrl: v.user.profilePhotoUrl,
      checkInTime: v.checkInTime.toISOString(),
    }))
  );
}
