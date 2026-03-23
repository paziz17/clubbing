import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_EVENTS_MAP } from "@/lib/demo-events";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const demo = DEMO_EVENTS_MAP[id];
  if (demo) return NextResponse.json(demo);

  try {
    const row = await prisma.event.findUnique({
      where: { id },
      include: { venue: { select: { name: true } } },
    });
    if (!row) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    const { venue, ...event } = row;
    return NextResponse.json({
      ...event,
      venueName: venue?.name ?? null,
      tags: JSON.parse(event.tags || "[]"),
      date: event.date.toISOString(),
    });
  } catch (err) {
    console.error("[api/events/[id]]", err);
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
}
