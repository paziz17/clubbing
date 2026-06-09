import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CheckoutFlow } from "./checkout-flow";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: {
      tickets: { where: { active: true }, orderBy: { priceAgorot: "asc" } },
      venue: true,
    },
  });
  if (!event) notFound();

  return (
    <CheckoutFlow
      event={JSON.parse(JSON.stringify(event))}
    />
  );
}
