import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/auth";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "מספר טלפון נדרש" }, { status: 400 });
    }

    const normalized = phone.replace(/\D/g, "");
    if (normalized.length < 9) {
      return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });
    }

    const tenMinAgo = new Date(Date.now() - RATE_WINDOW_MS);
    const recentAttempts = await prisma.otpAttempt.count({
      where: { phone: normalized, createdAt: { gte: tenMinAgo } },
    });

    if (recentAttempts >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "יותר מדי ניסיונות. נסה שוב בעוד 10 דקות." },
        { status: 429 }
      );
    }

    const code = generateOTP();
    const expiryMinutes = process.env.NODE_ENV === "development" ? 30 : 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await prisma.otpAttempt.create({
      data: { phone: normalized, code, expiresAt },
    });

    // In production: send SMS. For MVP: log to console
    console.log(`[OTP] ${normalized} => ${code} (expires ${expiresAt.toISOString()})`);

    return NextResponse.json({
      success: true,
      message: "קוד נשלח. בפיתוח: הקוד מוצג בקונסול.",
      // For dev only - remove in production:
      devCode: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
