import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyRazorpayPayment } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify signature
    const isValid = await verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Determine plan limits
    const planLimits: Record<string, number> = {
      BASIC: 100,
      PREMIUM: -1,
      TEAM: -1,
    };

    const selectedPlan = plan || 'BASIC';
    const limit = planLimits[selectedPlan] || 100;

    // Update subscription
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: selectedPlan,
        applicationsLimit: limit,
        applicationsUsed: 0,
        razorpayId: razorpayPaymentId,
        paymentId: razorpayOrderId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: session.user.id,
        plan: selectedPlan,
        applicationsLimit: limit,
        razorpayId: razorpayPaymentId,
        paymentId: razorpayOrderId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, plan: selectedPlan });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
