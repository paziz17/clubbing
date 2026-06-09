import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAge } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { eventId } = await req.json();
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const application = await db.exclusiveApplication.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: {
      userId,
      eventId,
      venueId: event.venueId,
      snapshotName: user.name ?? "",
      snapshotCity: user.city ?? undefined,
      snapshotAge: user.birthDate ? calculateAge(user.birthDate) : undefined,
      snapshotImage: user.image ?? undefined,
      snapshotInstagram: user.instagramHandle ?? undefined,
    },
    update: {},
  });

  return NextResponse.json({ applicationId: application.id, status: application.status });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");
  if (!userId || !eventId) return NextResponse.json({ status: null });
  const app = await db.exclusiveApplication.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  return NextResponse.json({ status: app?.status ?? null });
}
