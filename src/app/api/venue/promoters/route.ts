import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  commissionPct: z.number().min(0).max(100).default(0),
});

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "promo"
  );
}

async function uniqueCode(base: string) {
  for (let i = 0; i < 6; i++) {
    const code = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const exists = await db.promoter.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireCapability("promoters");
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const code = await uniqueCode(slugify(parsed.data.name));
    const promoter = await db.promoter.create({
      data: {
        venueId: ctx.venue.id,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        commissionPct: parsed.data.commissionPct,
        code,
      },
    });
    return NextResponse.json({ promoter });
  } catch (err: any) {
    const status = err.message === "FORBIDDEN" ? 403 : err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
