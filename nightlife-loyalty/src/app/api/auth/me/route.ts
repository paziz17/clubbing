import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "טוקן לא תקף" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    birthdate: user.birthdate.toISOString().split("T")[0],
    profilePhotoUrl: user.profilePhotoUrl,
    city: user.city,
    gender: user.gender,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "טוקן לא תקף" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, city, profilePhotoUrl, gender } = body;

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(city !== undefined && { city }),
      ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
      ...(gender !== undefined && { gender }),
    },
  });

  return NextResponse.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    birthdate: user.birthdate.toISOString().split("T")[0],
    profilePhotoUrl: user.profilePhotoUrl,
    city: user.city,
    gender: user.gender,
  });
}
