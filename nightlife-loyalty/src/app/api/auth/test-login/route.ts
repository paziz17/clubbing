import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

// התחברות לטסט - עובד רק ב-development
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "לא זמין בפרודקשן" }, { status: 403 });
  }

  const testPhone = "0500000000";
  let user = await prisma.user.findUnique({
    where: { phone: testPhone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: testPhone,
        name: "משתמש טסט",
        birthdate: new Date("1990-01-01"),
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
}
