import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FoodOrderFlow } from "./order-flow";

export default async function FoodOrderPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = await db.venue.findUnique({ where: { id: venueId } });
  if (!venue || !venue.kitchenEnabled) notFound();
  const menu = await db.foodMenuItem.findMany({
    where: { venueId, active: true, section: "RESTAURANT" },
    orderBy: [{ category: "asc" }, { priceAgorot: "asc" }],
  });
  return <FoodOrderFlow venue={JSON.parse(JSON.stringify(venue))} menu={JSON.parse(JSON.stringify(menu))} />;
}
