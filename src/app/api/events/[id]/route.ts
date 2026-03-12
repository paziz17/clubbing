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
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    return NextResponse.json({
      ...event,
      tags: JSON.parse(event.tags || "[]"),
      date: event.date.toISOString(),
    });
  } catch (err) {
    console.error("[api/events/[id]]", err);
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
}
