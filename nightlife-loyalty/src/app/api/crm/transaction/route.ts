import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { earnCredits } from "@/lib/credit";

const DEDUP_WINDOW_MS = 30 * 1000; // 30 seconds

export async function POST(req: NextRequest) {
  const { user_id, visit_id, club_id, amount, receipt_id } = await req.json();

  if (!user_id || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "user_id ו-amount (חיובי) נדרשים" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: user_id },
  });
  if (!user) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  let clubId: string | null = null;
  if (visit_id) {
    const visit = await prisma.visit.findUnique({ where: { id: visit_id } });
    clubId = visit?.clubId ?? null;
  } else if (club_id) {
    clubId = club_id;
  }

  if (!clubId) {
    return NextResponse.json(
      { error: "visit_id או club_id נדרש" },
      { status: 400 }
    );
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
  });
  if (!club) {
    return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
  }

  if (receipt_id) {
    const existing = await prisma.transaction.findFirst({
      where: { clubId, receiptId: receipt_id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "עסקה עם receipt_id זה כבר קיימת" },
        { status: 400 }
      );
    }
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - DEDUP_WINDOW_MS);
  const duplicate = await prisma.transaction.findFirst({
    where: {
      userId: user_id,
      clubId,
      amount,
      createdAt: { gte: windowStart },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "עסקה כפולה - אנטי-דאבל" },
      { status: 400 }
    );
  }

  const tx = await prisma.transaction.create({
    data: {
      visitId: visit_id || null,
      clubId,
      userId: user_id,
      amount: Number(amount),
      receiptId: receipt_id || null,
    },
  });

  const creditsEarned = Math.floor(amount * club.earnRate);
  if (creditsEarned > 0) {
    await earnCredits(
      user_id,
      clubId,
      creditsEarned,
      club.expirationDays,
      { transactionId: tx.id }
    );
  }

  return NextResponse.json({
    success: true,
    transactionId: tx.id,
    creditsEarned,
  });
}
