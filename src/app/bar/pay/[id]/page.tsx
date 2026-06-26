import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/utils";
import { GlassWater, XCircle } from "lucide-react";
import { BarPayButtons } from "./pay-buttons";

export default async function BarPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.barOrder.findUnique({
    where: { id },
    include: { venue: { select: { name: true } } },
  });
  if (!order) notFound();
  if (order.status === "PAID") redirect(`/bar/paid/${id}`);

  if (order.status !== "PENDING_PAYMENT") {
    return (
      <div className="mobile-screen pb-10">
        <div className="px-5 pt-16 text-center">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-ink mb-2">ההזמנה אינה זמינה</h1>
          <p className="text-sm text-ink-muted">ההזמנה בוטלה או שפג תוקפה.</p>
        </div>
      </div>
    );
  }

  const items: { name: string; qty: number; priceAgorot: number }[] = JSON.parse(order.items);

  return (
    <div className="mobile-screen pb-10">
      <div className="px-5 pt-12 pb-6 text-center">
        <div className="inline-flex w-14 h-14 rounded-full bg-gold/10 border border-gold/40 items-center justify-center mb-3">
          <GlassWater className="w-7 h-7 text-gold" />
        </div>
        <h1 className="font-display text-2xl text-gold mb-1">תשלום בבר</h1>
        <p className="text-sm text-ink-muted">{order.venue.name}</p>
      </div>

      <div className="px-5">
        <div className="card-elevated p-5">
          <div className="space-y-2 text-sm">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-ink-muted">{it.qty} × {it.name}</span>
                <span className="text-ink">{formatILS(it.priceAgorot * it.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-line mt-3 pt-3 flex items-center justify-between">
            <span className="text-ink font-semibold">סה״כ</span>
            <span className="font-display text-2xl text-gold">{formatILS(order.subtotalAgorot)}</span>
          </div>
        </div>

        <BarPayButtons orderId={id} />
      </div>
    </div>
  );
}
