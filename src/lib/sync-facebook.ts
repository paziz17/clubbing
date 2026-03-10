import { prisma } from "@/lib/prisma";

const FB_API = "https://graph.facebook.com/v21.0";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "תל אביב": { lat: 32.0808, lng: 34.7805 },
  "חיפה": { lat: 32.813, lng: 34.999 },
  "ירושלים": { lat: 31.769, lng: 35.216 },
  "אילת": { lat: 29.558, lng: 34.951 },
  "הרצליה": { lat: 32.163, lng: 34.844 },
  "רמת גן": { lat: 32.085, lng: 34.812 },
  "נהריה": { lat: 33.005, lng: 35.099 },
  "עכו": { lat: 32.928, lng: 35.082 },
  "כרמיאל": { lat: 32.909, lng: 35.293 },
  "טבריה": { lat: 32.793, lng: 35.531 },
  "נתניה": { lat: 32.331, lng: 34.858 },
  "באר שבע": { lat: 31.252, lng: 34.791 },
  "מצפה רמון": { lat: 30.609, lng: 34.801 },
};

export async function syncFacebookEvents(): Promise<{ synced: number; errors: string[] }> {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageIds = process.env.FACEBOOK_PAGE_IDS?.split(",").map((s) => s.trim()).filter(Boolean);

  if (!token || !pageIds?.length) {
    return { synced: 0, errors: [] };
  }

  const synced: string[] = [];
  const errors: string[] = [];

  for (const pageId of pageIds) {
    try {
      const url = `${FB_API}/${pageId}/events?fields=id,name,description,start_time,end_time,place,cover,ticket_uri&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const data = (await res.json()) as { data?: Array<Record<string, unknown>>; error?: { message: string } };

      if (data.error) {
        errors.push(`${pageId}: ${data.error.message}`);
        continue;
      }

      const events = data.data ?? [];
      for (const ev of events) {
        const id = ev.id as string;
        const name = (ev.name as string) || "אירוע";
        const description = (ev.description as string) || "";
        const startTime = ev.start_time as string;
        const place = ev.place as { name?: string; location?: { city?: string; street?: string } } | undefined;
        const cover = ev.cover as { source?: string } | undefined;
        const ticketUri = ev.ticket_uri as string | undefined;

        const location = place?.location?.city ?? place?.name ?? "ישראל";
        const address = place?.location?.street ?? place?.name ?? "";
        const coords = CITY_COORDS[location] ?? null;

        await prisma.event.upsert({
          where: { externalId: id },
          create: {
            name,
            description,
            date: new Date(startTime),
            time: new Date(startTime).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
            location,
            address,
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null,
            imageUrl: cover?.source ?? null,
            ticketLink: ticketUri ?? null,
            tags: JSON.stringify(["Facebook"]),
            status: "approved",
            source: "facebook",
            externalId: id,
          },
          update: {
            name,
            description,
            date: new Date(startTime),
            time: new Date(startTime).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
            location,
            address,
            lat: coords?.lat ?? undefined,
            lng: coords?.lng ?? undefined,
            imageUrl: cover?.source ?? undefined,
            ticketLink: ticketUri ?? undefined,
          },
        });
        synced.push(id);
      }
    } catch (e) {
      errors.push(`${pageId}: ${String(e)}`);
    }
  }

  return { synced: synced.length, errors };
}
