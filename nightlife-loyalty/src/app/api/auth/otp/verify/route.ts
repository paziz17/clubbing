import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone, code, name, birthdate, email } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "טלפון וקוד נדרשים" }, { status: 400 });
    }

    const normalized = phone.replace(/\D/g, "");
    const codeStr = String(code).trim();

    const attempt = await prisma.otpAttempt.findFirst({
      where: { phone: normalized, code: codeStr, verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!attempt) {
      return NextResponse.json({ error: "קוד שגוי או פג תוקף" }, { status: 400 });
    }

    if (attempt.expiresAt < new Date()) {
      return NextResponse.json({ error: "קוד פג תוקף - בקש קוד חדש" }, { status: 400 });
    }

    await prisma.otpAttempt.update({
      where: { id: attempt.id },
      data: { verified: true },
    });

    let user = await prisma.user.findUnique({
      where: { phone: normalized },
    });

    if (!user) {
      if (!name || !birthdate) {
        return NextResponse.json(
          { error: "שם ותאריך לידה נדרשים להרשמה", requiresSignup: true },
          { status: 400 }
        );
      }

      const birth = new Date(birthdate);
      const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) {
        return NextResponse.json({ error: "גיל מינימלי 18" }, { status: 400 });
      }

      user = await prisma.user.create({
        data: {
          phone: normalized,
          name: String(name),
          birthdate: birth,
          email: email || null,
        },
      });
    }

    const token = await signToken({ userId: user.id, phone: user.phone });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        birthdate: user.birthdate.toISOString().split("T")[0],
        profilePhotoUrl: user.profilePhotoUrl,
        city: user.city,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
