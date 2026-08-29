import Stripe from 'stripe';
import Razorpay from 'razorpay';

// Lazy init
let stripe: Stripe | null = null;
let razorpay: Razorpay | null = null;

function getStripe(): Stripe | null {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia' });
  }
  return stripe;
}

function getRazorpay(): Razorpay | null {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

export const PLANS = {
  FREE: { name: 'Free', price: 0, limit: 3, features: ['3 applications/month', 'Email + LinkedIn outreach', 'AI-generated cover letters', 'Basic job matching'] },
  BASIC: { name: 'Basic', price: 299, limit: 100, features: ['100 applications/month', 'Priority job matching', 'Resume customization', 'Email tracking', 'Auto-apply bot'] },
  PREMIUM: { name: 'Premium', price: 499, limit: -1, features: ['Unlimited applications', 'Priority matching', 'Full AI suite', 'LinkedIn automation', 'Interview prep AI', 'Referral finder'] },
  TEAM: { name: 'Team', price: 1999, limit: -1, features: ['5 team members', 'Everything in Premium', 'Team analytics', 'Shared job boards', 'Bulk operations'] },
} as const;

// Create Stripe checkout session
export async function createStripeCheckout(userId: string, plan: keyof typeof PLANS, origin: string) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured');

  const planData = PLANS[plan];
  const session = await s.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'inr',
        product_data: { name: `JobSwipe ${planData.name} Plan`, description: planData.features.join(', ') },
        unit_amount: planData.price * 100,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${origin}/settings?tab=billing&success=true`,
    cancel_url: `${origin}/settings?tab=billing&cancelled=true`,
    metadata: { userId, plan },
  });
  return session;
}

// Create Razorpay order
export async function createRazorpayOrder(userId: string, plan: keyof typeof PLANS) {
  const r = getRazorpay();
  if (!r) throw new Error('Razorpay not configured');

  const planData = PLANS[plan];
  const order = await r.orders.create({
    amount: planData.price * 100,
    currency: 'INR',
    receipt: `receipt_${userId}_${Date.now()}`,
    notes: { userId, plan },
  });
  return order;
}

// Verify Razorpay payment
export async function verifyRazorpayPayment(paymentId: string, orderId: string, signature: string): Promise<boolean> {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
  hmac.update(`${orderId}|${paymentId}`);
  const digest = hmac.digest('hex');
  return digest === signature;
}

// Get subscription status
export async function getSubscriptionStatus(subscription: any) {
  const plan = PLANS[subscription.plan as keyof typeof PLANS] || PLANS.FREE;
  return {
    plan: subscription.plan,
    planName: plan.name,
    applicationsUsed: subscription.applicationsUsed,
    applicationsLimit: subscription.applicationsLimit,
    applicationsRemaining: subscription.applicationsLimit === -1 ? 'Unlimited' : Math.max(0, subscription.applicationsLimit - subscription.applicationsUsed),
    features: plan.features,
    price: plan.price,
    isActive: subscription.endDate ? new Date(subscription.endDate) > new Date() : true,
  };
}
