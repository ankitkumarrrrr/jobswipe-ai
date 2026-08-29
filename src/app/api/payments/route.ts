import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { createStripeCheckout, createRazorpayOrder, verifyRazorpayPayment, PLANS } from '@/lib/payments';

const prisma = new PrismaClient();

// GET - Get subscription status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const user = await prisma.user.findFirst({
      where: { id: sessionToken },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const plan = PLANS[user.subscription?.plan as keyof typeof PLANS] || PLANS.FREE;
    const sub = user.subscription;

    return NextResponse.json({
      plan: sub?.plan || 'FREE',
      planName: plan.name,
      applicationsUsed: sub?.applicationsUsed || 0,
      applicationsLimit: sub?.applicationsLimit || 5,
      applicationsRemaining: (sub?.applicationsLimit || 5) === -1 ? 'Unlimited' : Math.max(0, (sub?.applicationsLimit || 5) - (sub?.applicationsUsed || 0)),
      features: plan.features,
      price: plan.price,
      endDate: sub?.endDate,
      createdAt: sub?.startDate,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create payment session or upgrade
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const user = await prisma.user.findFirst({
      where: { id: sessionToken },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { plan, paymentMethod, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await req.json();

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planData = PLANS[plan as keyof typeof PLANS];

    // Handle free plan
    if (plan === 'FREE') {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { plan: 'FREE', applicationsLimit: 5 },
        create: { userId: user.id, plan: 'FREE', applicationsLimit: 5 },
      });
      return NextResponse.json({ success: true, plan: 'FREE' });
    }

    // Handle Razorpay verification
    if (paymentMethod === 'razorpay' && razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      const isValid = await verifyRazorpayPayment(razorpayPaymentId, razorpayOrderId, razorpaySignature);
      if (!isValid) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          plan,
          applicationsLimit: planData.limit,
          applicationsUsed: 0,
          razorpayId: razorpayPaymentId,
          paymentId: razorpayOrderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        create: {
          userId: user.id,
          plan,
          applicationsLimit: planData.limit,
          razorpayId: razorpayPaymentId,
          paymentId: razorpayOrderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({ success: true, plan });
    }

    // Create Stripe checkout
    if (paymentMethod === 'stripe') {
      const origin = req.headers.get('origin') || 'http://localhost:3001';
      const session = await createStripeCheckout(user.id, plan as keyof typeof PLANS, origin);
      return NextResponse.json({ checkoutUrl: session.url, plan });
    }

    // Create Razorpay order
    if (paymentMethod === 'razorpay') {
      try {
        const { createRazorpayOrder: createOrder } = await import('@/lib/razorpay');
        const order = await createOrder(plan, user.id);
        return NextResponse.json({ orderId: order.orderId, amount: order.amount, currency: order.currency, key: order.key, plan });
      } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Razorpay not configured. Add keys to .env.local' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}
