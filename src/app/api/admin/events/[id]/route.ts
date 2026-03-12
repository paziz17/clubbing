import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";
import { DEMO_EVENTS_MAP } from "@/lib/demo-events";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const { id } = await params;

  const demo = DEMO_EVENTS_MAP[id];
  if (demo) {
    return NextResponse.json({ ...demo, reservations: [] });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        reservations: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }
}
