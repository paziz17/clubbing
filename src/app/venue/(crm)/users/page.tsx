import { redirect } from "next/navigation";
import { requireVenueSession } from "@/lib/venue-session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { UsersManager } from "./users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  let ctx;
  try {
    ctx = await requireVenueSession();
  } catch {
    redirect("/venue/login");
  }
  if (!can(ctx.role, "users")) {
    redirect("/venue");
  }

  const users = await db.venueUser.findMany({
    where: { venueId: ctx.venue.id },
    select: { id: true, name: true, username: true, role: true, active: true, lastLoginAt: true },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">משתמשים והרשאות</h1>
        <p className="text-sm text-ink-muted mt-1">
          נהל את חשבונות הצוות של <b>{ctx.venue.name}</b> — לכל חשבון שם משתמש, סיסמה ותפקיד נפרדים.
        </p>
      </div>
      <UsersManager
        initialUsers={users.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null }))}
        venueUsername={ctx.venue.username}
      />
    </div>
  );
}
