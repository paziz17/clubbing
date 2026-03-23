import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashToken, generateQRToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "טוקן לא תקף" }, { status: 401 });
  }

  const { id: clubId } = await params;
  const body = await req.json();
  const { startTime, endTime } = body;

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) {
    return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
  }

  const visitDate = new Date(startTime || Date.now());
  const start = new Date(startTime || Date.now());
  const end = new Date(endTime || start.getTime() + 8 * 60 * 60 * 1000); // +8h default

  const qrToken = generateQRToken();
  const qrTokenHash = hashToken(qrToken);

  const pass = await prisma.pass.create({
    data: {
      clubId,
      userId: payload.userId,
      visitDate: start,
      startTime: start,
      endTime: end,
      status: "created",
      qrTokenHash,
    },
  });

  return NextResponse.json({
    id: pass.id,
    clubId: pass.clubId,
    status: pass.status,
    startTime: pass.startTime.toISOString(),
    endTime: pass.endTime.toISOString(),
    qrToken, // Client uses this for QR - in prod consider short-lived
  });
}
