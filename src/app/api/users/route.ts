import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, age, location, gender, sexualPreference, profilePhotoUrl, isGuest } = body;

  const user = await prisma.user.create({
    data: {
      name: name || "משתמש",
      age: age ? parseInt(String(age), 10) : null,
      location: location || null,
      gender: gender || null,
      sexualPreference: sexualPreference || null,
      profilePhotoUrl: profilePhotoUrl || null,
      isGuest: isGuest ?? false,
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    age: user.age,
    location: user.location,
    gender: user.gender,
    profilePhotoUrl: user.profilePhotoUrl,
    isGuest: user.isGuest,
  });
}
