import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { finalizeStripePayment } from "@/lib/checkout";

// Stripe requires the raw, unparsed body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (secret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } else {
      // No signing secret configured (e.g. early POC) — parse without verifying.
      // Set STRIPE_WEBHOOK_SECRET in production to enable signature checks.
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const reservationId = session.metadata?.reservationId;
        if (reservationId && session.payment_status === "paid") {
          const ref =
            (typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id) ?? session.id;
          await finalizeStripePayment(reservationId, ref);
        }
        break;
      }
      default:
        // Other event types are ignored for now.
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
