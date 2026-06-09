import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { artistId } = await req.json();
  await db.artistFollow.upsert({
    where: { userId_artistId: { userId, artistId } },
    create: { userId, artistId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { artistId } = await req.json();
  await db.artistFollow.deleteMany({ where: { userId, artistId } });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ following: [] });
  const follows = await db.artistFollow.findMany({
    where: { userId },
    include: { artist: true },
  });
  return NextResponse.json({ following: follows.map((f) => f.artist) });
}
