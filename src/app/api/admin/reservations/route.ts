import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        event: { select: { id: true, name: true, date: true } },
      },
    });

    return NextResponse.json(reservations);
  } catch {
    return NextResponse.json([]);
  }
}
