import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVenue } from "@/lib/venue-session";
import { db } from "@/lib/db";
import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp";
import { sendToSubscriptions, pushConfigured } from "@/lib/push";

const schema = z.object({
  kind: z.enum(["CHASER_50", "FREE_ENTRY_WOMEN", "FREE_FIRST_DRINK_WOMEN_18", "CUSTOM"]),
  message: z.string().min(5),
  audience: z.enum(["ALL_MEMBERS", "WOMEN_ONLY", "MEN_ONLY", "SILVER_AND_UP"]),
  // Send a web-push alongside WhatsApp to members who enabled notifications.
  push: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const venue = await requireVenue();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Determine recipients — only Club-it members with phone who made at least one transaction here
  const where: any = {
    user: {
      phone: { not: null },
      clubItCard: { isNot: null },
    },
    venueId: venue.id,
  };
  if (parsed.data.audience === "WOMEN_ONLY") where.user.gender = "FEMALE";
  if (parsed.data.audience === "MEN_ONLY") where.user.gender = "MALE";
  if (parsed.data.audience === "SILVER_AND_UP")
    where.user.clubItCard = { tier: { in: ["SILVER", "GOLD", "PLATINUM"] } };

  const txns = await db.transaction.findMany({
    where,
    include: { user: true },
    distinct: ["userId"],
    take: 5000,
  });

  const recipients = txns.filter((t) => t.user?.phone);

  const campaign = await db.campaign.create({
    data: {
      venueId: venue.id,
      kind: parsed.data.kind,
      message: parsed.data.message,
      audience: parsed.data.audience,
      recipients: recipients.length,
      status: "SENDING",
    },
  });

  let delivered = 0;
  const fallback: string[] = [];
  for (const r of recipients) {
    const out = await sendWhatsApp({ to: r.user!.phone!, message: parsed.data.message });
    if (out.delivered) delivered++;
    else if ("waMeUrl" in out) fallback.push(out.waMeUrl);
  }

  // Push the same message to members who turned notifications on.
  let pushDelivered = 0;
  if (parsed.data.push && pushConfigured()) {
    const phones = [...new Set(recipients.map((r) => r.user!.phone!).filter(Boolean))];
    if (phones.length) {
      const subs = await db.pushSubscription.findMany({
        where: { active: true, phone: { in: phones } },
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      });
      if (subs.length) {
        const res = await sendToSubscriptions(subs, {
          title: venue.name || "Clubbing",
          body: parsed.data.message,
          url: "https://clubbing.co.il",
          tag: `camp-${campaign.id}`,
        });
        pushDelivered = res.sent;
      }
    }
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: {
      delivered,
      status: isWhatsAppConfigured() ? "SENT" : "FAILED",
      sentAt: new Date(),
    },
  });

  return NextResponse.json({
    campaignId: campaign.id,
    recipients: recipients.length,
    delivered,
    pushDelivered,
    mode: isWhatsAppConfigured() ? "cloud-api" : "fallback",
    fallback,
  });
}
