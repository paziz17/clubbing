import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { issueClubItCard } from "@/lib/club-it-card";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(26),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.clubItCard.findUnique({ where: { userId } });
  if (existing) {
    return NextResponse.json({ cardId: existing.id, existing: true });
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { name: parsed.data.name, phone: parsed.data.phone },
  });

  const issued = await issueClubItCard({
    userId,
    cardholderName: parsed.data.name,
    email: user.email ?? undefined,
  });

  const card = await db.clubItCard.create({
    data: {
      userId,
      displayName: parsed.data.name.toUpperCase(),
      cardNumberLast4: issued.last4,
      virtualCardId: issued.cardId,
    },
  });

  return NextResponse.json({
    cardId: card.id,
    last4: card.cardNumberLast4,
  });
}
