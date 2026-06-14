import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/venue-session";
import { normalizeRole } from "@/lib/rbac";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["OWNER", "MANAGER", "STAFF", "DOOR"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

function handle(err: any) {
  const status = err?.message === "FORBIDDEN" ? 403 : err?.message === "UNAUTHORIZED" ? 401 : 500;
  return NextResponse.json({ error: err?.message ?? "error" }, { status });
}

async function owned(venueId: string, id: string) {
  return db.venueUser.findFirst({ where: { id, venueId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { venue } = await requireCapability("users");
    const { id } = await params;
    const target = await owned(venue.id, id);
    if (!target) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data: any = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.role) data.role = normalizeRole(parsed.data.role);
    if (typeof parsed.data.active === "boolean") data.active = parsed.data.active;
    if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const user = await db.venueUser.update({
      where: { id },
      data,
      select: { id: true, name: true, username: true, role: true, active: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handle(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { venue } = await requireCapability("users");
    const { id } = await params;
    const target = await owned(venue.id, id);
    if (!target) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    await db.venueUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}
