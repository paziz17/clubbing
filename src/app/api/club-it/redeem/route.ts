import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redeemCredits } from "@/lib/credits";
import { generateVoucherCode } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  venueId: z.string(),
  amount: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const card = await db.clubItCard.findUnique({ where: { userId } });
  if (!card) return NextResponse.json({ error: "NO_CARD" }, { status: 404 });

  const settings = await db.venueSettings.findUnique({
    where: { venueId: parsed.data.venueId },
  });
  const minimum = settings?.minRedemptionAgorot ?? 5000;
  if (parsed.data.amount < minimum) {
    return NextResponse.json(
      { error: `מימוש מינימלי ${minimum / 100}₪` },
      { status: 400 }
    );
  }

  try {
    await redeemCredits({
      cardId: card.id,
      venueId: parsed.data.venueId,
      amount: parsed.data.amount,
    });

    const code = generateVoucherCode();
    const voucher = await db.voucher.create({
      data: {
        code,
        cardId: card.id,
        venueId: parsed.data.venueId,
        amountAgorot: parsed.data.amount,
        qrPayload: JSON.stringify({ code, cardId: card.id, amount: parsed.data.amount }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ voucherId: voucher.id, code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
