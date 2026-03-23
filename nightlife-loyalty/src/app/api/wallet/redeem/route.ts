import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { calculateBalance, redeemCredits } from "@/lib/credit";

function generateVoucherCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function getUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateVoucherCode();
    const exists = await prisma.voucher.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("Could not generate unique voucher code");
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "טוקן לא תקף" }, { status: 401 });
  }

  const { club_id, credits } = await req.json();

  if (!club_id || !credits || credits <= 0) {
    return NextResponse.json(
      { error: "club_id ו-credits (חיובי) נדרשים" },
      { status: 400 }
    );
  }

  const club = await prisma.club.findUnique({
    where: { id: club_id },
  });
  if (!club) {
    return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
  }

  const minRedeem = club.minRedeem ?? 0;
  if (credits < minRedeem) {
    return NextResponse.json(
      { error: `מינימום למימוש: ${minRedeem} קרדיטים` },
      { status: 400 }
    );
  }

  const balance = await calculateBalance(payload.userId, club_id);
  if (balance < credits) {
    return NextResponse.json(
      { error: "יתרה לא מספקת", balance },
      { status: 400 }
    );
  }

  const code = await getUniqueCode();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24h validity

  const voucher = await prisma.voucher.create({
    data: {
      userId: payload.userId,
      clubId: club_id,
      code,
      credits,
      expiresAt,
    },
  });

  await redeemCredits(payload.userId, club_id, credits, {
    voucherId: voucher.id,
  });

  return NextResponse.json({
    success: true,
    code: voucher.code,
    credits: voucher.credits,
    expiresAt: voucher.expiresAt.toISOString(),
  });
}
