import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Razorpay webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // Find subscription by order receipt
      const order = await prisma.subscription.findFirst({
        where: { paymentId: orderId },
      });

      if (order) {
        const plan = order.plan;
        const planLimits: Record<string, number> = {
          BASIC: 100,
          PREMIUM: -1,
          TEAM: -1,
        };

        await prisma.subscription.update({
          where: { id: order.id },
          data: {
            razorpayId: paymentId,
            applicationsLimit: planLimits[plan] || 100,
            applicationsUsed: 0,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        console.log(`Payment captured for user ${order.userId}: ${plan} plan`);
      }
    }

    if (event.event === 'subscription.activated') {
      const subscription = event.payload.subscription.entity;
      console.log('Razorpay subscription activated:', subscription.id);
    }

    if (event.event === 'subscription.cancelled') {
      const subscription = event.payload.subscription.entity;
      console.log('Razorpay subscription cancelled:', subscription.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
