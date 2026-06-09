import { NextRequest, NextResponse } from "next/server";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { stringifyCsv } from "@/lib/enums";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  startsAt: z.string(),
  description: z.string().optional(),
  basePriceAgorot: z.number().int().positive(),
  capacity: z.number().int().min(1),
  tags: z.array(z.string()).default([]),
  genres: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const venue = await requireVenue();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const event = await db.event.create({
      data: {
        venueId: venue.id,
        name: parsed.data.name,
        description: parsed.data.description,
        startsAt: new Date(parsed.data.startsAt),
        basePriceAgorot: parsed.data.basePriceAgorot,
        capacity: parsed.data.capacity,
        tags: stringifyCsv(parsed.data.tags),
        genres: stringifyCsv(parsed.data.genres),
        status: "DRAFT",
        tickets: {
          create: [
            {
              kind: "STANDARD",
              label: "כרטיס רגיל",
              priceAgorot: parsed.data.basePriceAgorot,
            },
          ],
        },
      },
    });
    return NextResponse.json({ event });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
