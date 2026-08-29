import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-08-26.dahlia",
    });
  }
  return _stripe;
}

// Legacy export for backward compat
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

export const STRIPE_PLANS = {
  BASIC: {
    name: "Basic Plan",
    amount: 499,
    currency: "usd",
    interval: "month" as const,
    description: "100 applications/month with AI customization",
    metadata: { plan: "BASIC", applicationsLimit: "100" },
  },
  PREMIUM: {
    name: "Premium Plan",
    amount: 799,
    currency: "usd",
    interval: "month" as const,
    description: "Unlimited applications with priority matching",
    metadata: { plan: "PREMIUM", applicationsLimit: "-1" },
  },
};

export async function createStripeCheckoutSession(
  planId: string,
  userId: string,
  userEmail: string
) {
  const stripeClient = getStripe();
  const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS];
  if (!plan) throw new Error("Invalid plan");

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.amount,
          recurring: { interval: plan.interval },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings?canceled=true`,
    metadata: { userId, planId },
  });

  return { sessionId: session.id, url: session.url };
}

export async function createStripePortalSession(customerId: string) {
  const stripeClient = getStripe();
  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings`,
  });
  return { url: session.url };
}
