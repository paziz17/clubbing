import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, musicTypes, eventTypes, ageRange, region } = body;

  if (!userId) return NextResponse.json({ error: "userId נדרש" }, { status: 400 });

  await prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      musicTypes: JSON.stringify(musicTypes || []),
      eventTypes: JSON.stringify(eventTypes || []),
      ageRange: ageRange || null,
      region: region || null,
    },
    update: {
      musicTypes: JSON.stringify(musicTypes || []),
      eventTypes: JSON.stringify(eventTypes || []),
      ageRange: ageRange || null,
      region: region || null,
    },
  });

  return NextResponse.json({ success: true });
}
