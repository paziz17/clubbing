import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { accrueBumpCredits } from "@/lib/credits";
import { z } from "zod";

const schema = z.object({
  venueId: z.string(),
  lat: z.number(),
  lng: z.number(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Count distinct unique buddies who checked in here in the last 4 hours
  const fourHrsAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const buddies = await db.checkIn.findMany({
    where: {
      venueId: parsed.data.venueId,
      createdAt: { gte: fourHrsAgo },
      userId: { not: userId },
    },
    distinct: ["userId"],
  });

  const checkIn = await db.checkIn.create({
    data: {
      userId,
      venueId: parsed.data.venueId,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      buddyCount: buddies.length,
    },
  });

  // Award credits if user has a Club-it card
  const card = await db.clubItCard.findUnique({ where: { userId } });
  let creditsEarned = 0;
  if (card && buddies.length > 0) {
    const result = await accrueBumpCredits({
      cardId: card.id,
      venueId: parsed.data.venueId,
      buddyCount: buddies.length,
    });
    creditsEarned = result.creditsEarned;
    await db.checkIn.update({
      where: { id: checkIn.id },
      data: { creditsEarned },
    });
  }

  return NextResponse.json({
    checkInId: checkIn.id,
    buddyCount: buddies.length,
    creditsEarned,
  });
}
