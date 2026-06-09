import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key
  ? new Stripe(key, { apiVersion: "2025-06-30.basil" as Stripe.LatestApiVersion })
  : null;

export const isStripeConfigured = () => Boolean(stripe);

interface CreateCheckoutParams {
  amountAgorot: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  if (!stripe) {
    return {
      demo: true as const,
      url: `${params.successUrl}?demo=1`,
      sessionId: `demo_${Date.now()}`,
    };
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency ?? "ils",
          product_data: { name: "CLUBBING Ticket" },
          unit_amount: params.amountAgorot,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl + "?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: params.metadata ?? {},
    payment_intent_data: {
      // Stripe RBA — automatic 3DS per transaction
      // setup_future_usage: "off_session",
    },
  });
  return { demo: false as const, url: session.url!, sessionId: session.id };
}

interface IssueCardParams {
  userId: string;
  cardholderName: string;
  email?: string;
}

/**
 * Issue a virtual Club-it card via Stripe Issuing.
 * Returns last4 and a virtual card identifier (or a demo fallback if Stripe is not configured).
 */
export async function issueClubItCard(params: IssueCardParams) {
  if (!stripe || !process.env.STRIPE_ISSUING_ENABLED) {
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    return {
      demo: true as const,
      cardId: `demo_${Date.now()}`,
      last4,
    };
  }
  // Real Stripe Issuing flow requires a Cardholder + Card. Wired but enabled via env.
  try {
    const cardholder = await stripe.issuing.cardholders.create({
      name: params.cardholderName,
      email: params.email,
      status: "active",
      type: "individual",
      billing: {
        address: {
          line1: "1 Rothschild Blvd",
          city: "Tel Aviv",
          country: "IL",
          postal_code: "6688101",
        },
      },
      metadata: { userId: params.userId, source: "clubbing" },
    });
    const card = await stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: "ils",
      type: "virtual",
      status: "active",
    });
    return { demo: false as const, cardId: card.id, last4: card.last4 };
  } catch (err) {
    console.error("Stripe Issuing failed", err);
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    return {
      demo: true as const,
      cardId: `demo_${Date.now()}`,
      last4,
    };
  }
}
