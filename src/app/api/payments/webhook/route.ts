import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (userId && planId) {
      const limits: Record<string, number> = {
        BASIC: 100,
        PREMIUM: -1,
      };

      await prisma.subscription.update({
        where: { userId },
        data: {
          plan: planId as "BASIC" | "PREMIUM",
          applicationsUsed: 0,
          applicationsLimit: limits[planId] || 100,
          stripeId: session.subscription as string,
          startDate: new Date(),
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await prisma.subscription.updateMany({
      where: { stripeId: subscription.id },
      data: {
        plan: "FREE",
        applicationsLimit: 3,
        stripeId: null,
      },
    });
  }

  return NextResponse.json({ received: true });
}
