import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const body = await req.json();
  const { numPeople, phone, email, over18 } = body;

  if (!numPeople || !phone || !email || over18 !== true) {
    return NextResponse.json(
      { error: "נדרש: כמות אנשים, טלפון, מייל ואישור גיל 18+" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  await prisma.reservation.create({
    data: {
      eventId,
      numPeople: parseInt(String(numPeople), 10) || 1,
      phone: String(phone).trim(),
      email: String(email).trim(),
      over18: true,
    },
  });

  return NextResponse.json({ success: true, message: "ההזמנה נשלחה בהצלחה" });
}
