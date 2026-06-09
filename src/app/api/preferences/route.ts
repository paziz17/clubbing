import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  genreLikes: z.array(z.string()).default([]),
  genreSkips: z.array(z.string()).default([]),
  onboardingCompleted: z.boolean().optional(),
});

/**
 * Persist the user's discovery preferences (genres they liked / skipped)
 * to User.preferencesJson. Used by /onboarding + /discover.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  // Merge with existing preferences
  const current = await db.user.findUnique({
    where: { id: userId },
    select: { preferencesJson: true },
  });
  const existing = current?.preferencesJson
    ? JSON.parse(current.preferencesJson)
    : {};

  const next = {
    ...existing,
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  await db.user.update({
    where: { id: userId },
    data: { preferencesJson: JSON.stringify(next) },
  });

  return NextResponse.json({ ok: true, preferences: next });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ preferences: null });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferencesJson: true },
  });
  return NextResponse.json({
    preferences: user?.preferencesJson ? JSON.parse(user.preferencesJson) : null,
  });
}
