import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createStripeCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId || !["BASIC", "PREMIUM", "TEAM"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const checkoutSession = await createStripeCheckoutSession(
      planId,
      session.user.id,
      session.user.email
    );

    return NextResponse.json(checkoutSession);
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
