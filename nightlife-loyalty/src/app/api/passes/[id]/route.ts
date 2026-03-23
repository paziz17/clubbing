import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = _req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "טוקן לא תקף" }, { status: 401 });
  }

  const { id } = await params;
  const pass = await prisma.pass.findFirst({
    where: { id, userId: payload.userId },
    include: { club: true },
  });

  if (!pass) {
    return NextResponse.json({ error: "Pass לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({
    id: pass.id,
    clubId: pass.clubId,
    clubName: pass.club.name,
    status: pass.status,
    startTime: pass.startTime.toISOString(),
    endTime: pass.endTime.toISOString(),
    qrTokenHash: pass.qrTokenHash, // Client should have received qrToken on create
  });
}
