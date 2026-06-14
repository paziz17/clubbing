import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/venue-session";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9._-]+$/, "אותיות באנגלית, מספרים, נקודה/מקף בלבד"),
  password: z.string().min(6),
  role: z.enum(["OWNER", "MANAGER", "STAFF", "DOOR"]).default("STAFF"),
});

function handle(err: any) {
  const status = err?.message === "FORBIDDEN" ? 403 : err?.message === "UNAUTHORIZED" ? 401 : 500;
  return NextResponse.json({ error: err?.message ?? "error" }, { status });
}

export async function GET() {
  try {
    const { venue } = await requireCapability("users");
    const users = await db.venueUser.findMany({
      where: { venueId: venue.id },
      select: { id: true, name: true, username: true, role: true, active: true, lastLoginAt: true, createdAt: true },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ users, roles: ROLES });
  } catch (err) {
    return handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { venue } = await requireCapability("users");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, username, password, role } = parsed.data;

    const taken =
      (await db.venueUser.findUnique({ where: { username } })) ||
      (await db.venue.findUnique({ where: { username } }));
    if (taken) {
      return NextResponse.json({ error: "שם המשתמש כבר תפוס" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.venueUser.create({
      data: { venueId: venue.id, name, username, passwordHash, role: normalizeRole(role) },
      select: { id: true, name: true, username: true, role: true, active: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handle(err);
  }
}
