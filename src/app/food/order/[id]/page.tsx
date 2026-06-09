import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/utils";
import { parseJson } from "@/lib/enums";
import { Check } from "lucide-react";

interface OrderItem {
  itemId: string;
  name: string;
  qty: number;
  priceAgorot: number;
}

export default async function FoodOrderSuccess({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.foodOrder.findUnique({
    where: { id },
    include: { venue: true },
  });
  if (!order) notFound();

  return (
    <div className="mobile-screen pb-10">
      <div className="px-5 pt-16 pb-6 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-success/10 border border-success/40 items-center justify-center mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h1 className="font-display text-2xl text-gold mb-2">ההזמנה התקבלה</h1>
        <p className="text-sm text-ink-muted">המטבח מתחיל בהכנה</p>
      </div>

      <div className="mx-5 card-elevated p-6 text-center">
        <div className="text-xs text-ink-muted mb-2">קוד איסוף</div>
        <div className="font-mono text-4xl text-gold-gradient tracking-widest">{order.pickupCode}</div>
        <div className="text-xs text-ink-muted mt-4">הצג/י את הקוד בעמדת האיסוף</div>
      </div>

      <div className="mx-5 card-elevated p-5 mt-4">
        <h3 className="font-semibold text-ink mb-3">פירוט הזמנה</h3>
        <ul className="space-y-2 text-sm">
          {parseJson<OrderItem[]>(order.items, []).map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>× {it.qty} · {it.name}</span>
              <span className="text-ink-muted">{formatILS(it.priceAgorot * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-line my-3" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>סכום:</span><span>{formatILS(order.subtotalAgorot)}</span></div>
          {order.creditsApplied > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>קרדיטים:</span>
              <span>− {order.creditsApplied}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gold pt-2 border-t border-line">
            <span>סה״כ חיוב באשראי:</span>
            <span>{formatILS(order.cardChargedAgorot)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
