import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationCode, hashVerificationCode } from "@/lib/verification-token";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").toLowerCase().trim();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "name" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "email" }, { status: 400 });
    }
    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: "phone" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "password" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const code = generateVerificationCode();
    const tokenHash = hashVerificationCode(email, code);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          emailVerified: null,
        },
      });
      await tx.verificationToken.deleteMany({ where: { identifier: email } });
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: tokenHash,
          expires,
        },
      });
    });

    const mail = await sendVerificationEmail(email, name, code);
    if (!mail.ok) {
      await prisma.user.delete({ where: { email } }).catch(() => {});
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      return NextResponse.json({ error: "mail", detail: mail.error }, { status: 502 });
    }

    if (mail.via === "console" && process.env.NODE_ENV === "production") {
      await prisma.user.delete({ where: { email } }).catch(() => {});
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      return NextResponse.json({ error: "mail_config" }, { status: 503 });
    }

    const isDevConsole = mail.via === "console";
    return NextResponse.json({
      ok: true,
      ...(isDevConsole ? { devCode: mail.devCode, message: "smtp_missing" } : {}),
    });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
