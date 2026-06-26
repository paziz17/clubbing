import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { reconcileGrowBarOrder } from "@/lib/bar";
import { formatILS } from "@/lib/utils";
import { CheckCircle2, Clock } from "lucide-react";

export default async function BarPaidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Grow's success redirect carries no details — reconcile as a fallback.
  await reconcileGrowBarOrder(id);

  const order = await db.barOrder.findUnique({
    where: { id },
    include: { venue: { select: { name: true } } },
  });
  if (!order) notFound();

  const paid = order.status === "PAID";

  return (
    <div className="mobile-screen pb-10">
      <div className="px-6 pt-20 text-center">
        {paid ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h1 className="font-display text-2xl text-emerald-400 mb-2">התשלום עבר! 🎉</h1>
            <p className="text-sm text-ink-muted">
              {order.venue.name} · {formatILS(order.subtotalAgorot)}
            </p>
            <p className="text-sm text-ink-muted mt-1">אפשר לקבל את ההזמנה מהברמן/ית</p>
          </>
        ) : (
          <>
            <Clock className="w-16 h-16 text-gold mx-auto mb-4" />
            <h1 className="font-display text-2xl text-gold mb-2">ממתין לאישור התשלום…</h1>
            <p className="text-sm text-ink-muted">רענן/י בעוד רגע</p>
          </>
        )}
      </div>
    </div>
  );
}
