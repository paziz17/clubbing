import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { qr_token } = await req.json();

  if (!qr_token) {
    return NextResponse.json({ error: "qr_token נדרש" }, { status: 400 });
  }

  const hash = hashToken(qr_token);

  const pass = await prisma.pass.findFirst({
    where: { qrTokenHash: hash },
    include: { user: true, club: true },
  });

  if (!pass) {
    return NextResponse.json({ error: "QR לא תקף" }, { status: 404 });
  }

  if (pass.status === "checked_in") {
    return NextResponse.json(
      {
        error: "הבליין כבר נכנס",
        alreadyCheckedIn: true,
        userName: pass.user.name,
        profilePhotoUrl: pass.user.profilePhotoUrl,
      },
      { status: 400 }
    );
  }

  if (pass.status === "expired" || pass.status === "canceled") {
    return NextResponse.json(
      { error: "ה-Pass לא פעיל", status: pass.status },
      { status: 400 }
    );
  }

  const now = new Date();
  if (now > pass.endTime) {
    await prisma.pass.update({
      where: { id: pass.id },
      data: { status: "expired" },
    });
    return NextResponse.json(
      { error: "תוקף ה-Pass פג" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.pass.update({
      where: { id: pass.id },
      data: { status: "checked_in" },
    }),
    prisma.visit.create({
      data: {
        passId: pass.id,
        clubId: pass.clubId,
        userId: pass.userId,
      },
    }),
  ]);

  const visit = await prisma.visit.findUnique({
    where: { passId: pass.id },
  });

  return NextResponse.json({
    success: true,
    visitId: visit?.id,
    user: {
      id: pass.user.id,
      name: pass.user.name,
      profilePhotoUrl: pass.user.profilePhotoUrl,
    },
    passStatus: "checked_in",
  });
}
