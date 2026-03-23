import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(
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
  });

  if (!pass) {
    return NextResponse.json({ error: "Pass לא נמצא" }, { status: 404 });
  }

  if (pass.status !== "created") {
    return NextResponse.json(
      { error: "ניתן לבטל רק Pass בסטטוס created" },
      { status: 400 }
    );
  }

  await prisma.pass.update({
    where: { id },
    data: { status: "canceled" },
  });

  return NextResponse.json({ success: true });
}
