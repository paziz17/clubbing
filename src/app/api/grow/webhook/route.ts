import { NextResponse } from "next/server";
import { reconcileGrowProcess } from "@/lib/checkout";
import { reconcileGrowBarOrder } from "@/lib/bar";

// Grow notifies us server-to-server after a payment. We re-derive the
// reservation from the callback and run the mandatory approveTransaction step.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Grow may post either form-urlencoded or JSON; read both shapes leniently. */
async function readPayload(req: Request): Promise<Record<string, any>> {
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      return (await req.json()) as Record<string, any>;
    }
    const text = await req.text();
    if (!text) return {};
    if (text.trim().startsWith("{")) return JSON.parse(text);
    return Object.fromEntries(new URLSearchParams(text));
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const payload = await readPayload(req);
  const data = payload.data ?? payload;

  // cField1 carries our reservation id. Confirmed Grow shape nests it under
  // data.customFields.cField1; accept the flatter variants too, just in case.
  const reservationId: string | undefined =
    data.customFields?.cField1 ??
    data["customFields[cField1]"] ??
    data.cField1 ??
    payload.customFields?.cField1 ??
    payload.cField1;

  if (!reservationId) {
    // Nothing actionable — ack so Grow doesn't retry forever.
    return NextResponse.json({ received: true, skipped: "no reservation id" });
  }

  try {
    // Bar orders are tagged "bar:<orderId>"; everything else is a reservation.
    if (reservationId.startsWith("bar:")) {
      const result = await reconcileGrowBarOrder(reservationId.slice(4));
      return NextResponse.json({ received: true, status: result.status });
    }
    const result = await reconcileGrowProcess(reservationId);
    return NextResponse.json({ received: true, status: result.status });
  } catch (err) {
    console.error("Grow webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
