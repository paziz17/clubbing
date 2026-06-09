import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  venueId: z.string(),
  eventId: z.string().optional(),
  stars: z.number().int().min(1).max(5),
  categories: z.record(z.number()).optional(),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const review = await db.venueReview.create({
    data: {
      userId,
      venueId: parsed.data.venueId,
      eventId: parsed.data.eventId,
      stars: parsed.data.stars,
      categories: JSON.stringify(parsed.data.categories ?? {}),
      comment: parsed.data.comment,
    },
  });
  return NextResponse.json({ reviewId: review.id });
}
