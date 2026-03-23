import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
  });

  if (!club) {
    return NextResponse.json({ error: "מועדון לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({
    id: club.id,
    name: club.name,
    location: club.location,
    earnRate: club.earnRate,
    expirationDays: club.expirationDays,
    minRedeem: club.minRedeem,
    tierThresholds: club.tierThresholds ? JSON.parse(club.tierThresholds) : null,
  });
}
