import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, date, time, location, address, ticketLink, phone, ageRestriction, tags, createdById } = body;

  if (!name || !date || !location) {
    return NextResponse.json({ error: "שם, תאריך ומיקום נדרשים" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      name,
      description: description || "",
      date: new Date(date),
      time: time || "22:00",
      location,
      address: address || "",
      ticketLink: ticketLink || null,
      phone: phone || null,
      ageRestriction: ageRestriction || "18+",
      tags: JSON.stringify(Array.isArray(tags) ? tags : [tags]),
      status: "pending",
      createdById: createdById || null,
    },
  });

  return NextResponse.json({ id: event.id, status: "pending" });
}
