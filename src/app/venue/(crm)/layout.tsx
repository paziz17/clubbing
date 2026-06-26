import { redirect } from "next/navigation";
import { getVenueFromCookie } from "@/lib/venue-session";
import { normalizeRole, isPosOnlyRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { VenueSidebar } from "@/components/venue-sidebar";
import { PosTopbar } from "@/components/pos-topbar";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getVenueFromCookie();
  if (!session) redirect("/venue/login");
  const venue = await db.venue.findUnique({ where: { id: session.venueId } });
  if (!venue) redirect("/venue/login");
  const role = normalizeRole(session.role ?? "OWNER");
  const displayName = session.displayName ?? venue.name;

  // Bartenders / waiters get a stripped POS-only shell — no CRM sidebar.
  if (isPosOnlyRole(role)) {
    return (
      <div className="crm-container flex flex-col h-screen" dir="rtl">
        <PosTopbar venueName={venue.name} displayName={displayName} role={role} />
        <main className="flex-1 min-w-0 overflow-y-auto bg-bg">{children}</main>
      </div>
    );
  }

  return (
    <div className="crm-container flex min-h-screen" dir="rtl">
      {/* Fixed sidebar */}
      <VenueSidebar
        venueName={venue.name}
        kitchenEnabled={venue.kitchenEnabled}
        role={role}
        displayName={displayName}
      />

      {/* Scrollable main content — own scroll container so in-page sticky works */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto bg-bg">
        {children}
      </main>
    </div>
  );
}
