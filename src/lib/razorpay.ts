import Razorpay from "razorpay";

let _razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not set");
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: number;
  description: string;
}

export const PLANS: Record<string, SubscriptionPlan> = {
  BASIC: {
    id: "basic_monthly",
    name: "Basic Plan",
    amount: 29900,
    currency: "INR",
    interval: 1,
    description: "100 applications/month with AI customization",
  },
  PREMIUM: {
    id: "premium_monthly",
    name: "Premium Plan",
    amount: 49900,
    currency: "INR",
    interval: 1,
    description: "Unlimited applications with priority matching",
  },
  TEAM: {
    id: "team_monthly",
    name: "Team Plan",
    amount: 199900,
    currency: "INR",
    interval: 1,
    description: "5 team members with unlimited applications",
  },
};

export async function createRazorpayOrder(planId: string, userId: string) {
  const razorpay = getRazorpay();
  const plan = PLANS[planId];
  if (!plan) throw new Error("Invalid plan");

  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: plan.currency,
    receipt: `user_${userId}_plan_${planId}_${Date.now()}`,
    notes: { userId, planId },
  });

  return {
    orderId: order.id,
    amount: plan.amount,
    currency: plan.currency,
    key: process.env.RAZORPAY_KEY_ID,
  };
}

export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  const crypto = await import("crypto");
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}
