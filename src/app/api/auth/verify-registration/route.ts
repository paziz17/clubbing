import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashVerificationCode } from "@/lib/verification-token";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    const code = String(body.code ?? "").replace(/\s/g, "");

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const tokenHash = hashVerificationCode(email, code);
    const vt = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: tokenHash,
        expires: { gt: new Date() },
      },
    });

    if (!vt) {
      return NextResponse.json({ error: "code" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "user" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[verify-registration]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
