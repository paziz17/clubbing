import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// מושך תמונת פרופיל מ-Google ומעדכן ב-DB
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const account = await prisma.account.findFirst({
    where: {
      user: { email: session.user.email },
      provider: "google",
    },
    select: { access_token: true },
  });
  if (!account?.access_token) {
    return NextResponse.json({ error: "No Google account linked" }, { status: 400 });
  }
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${account.access_token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from Google" }, { status: 502 });
    }
    const data = (await res.json()) as { picture?: string; email?: string };
    const image = data.picture;
    if (!image) {
      return NextResponse.json({ profilePhotoUrl: null });
    }
    await prisma.user.updateMany({
      where: { email: session.user.email },
      data: { image, profilePhotoUrl: image },
    });
    return NextResponse.json({ profilePhotoUrl: image });
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
