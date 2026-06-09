import { redirect } from "next/navigation";
import { getVenueFromCookie } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { VenueSidebar } from "@/components/venue-sidebar";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getVenueFromCookie();
  if (!session) redirect("/venue/login");
  const venue = await db.venue.findUnique({ where: { id: session.venueId } });
  if (!venue) redirect("/venue/login");

  return (
    <div className="crm-container flex min-h-screen" dir="rtl">
      {/* Fixed sidebar */}
      <VenueSidebar venueName={venue.name} kitchenEnabled={venue.kitchenEnabled} />

      {/* Scrollable main content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-bg">
        {children}
      </main>
    </div>
  );
}
