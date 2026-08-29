import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
// @ts-ignore
import webpush from 'web-push';

const prisma = new PrismaClient();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:support@jobswipe.ai', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

// POST - Subscribe to push notifications
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { endpoint, p256dh, auth: pushAuth } = await req.json();

    await prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId: sessionToken, endpoint } },
      update: { p256dh, auth: pushAuth },
      create: { userId: sessionToken, endpoint, p256dh, auth: pushAuth },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { endpoint } = await req.json();
    await prisma.pushSubscription.deleteMany({ where: { userId: sessionToken, endpoint } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send notification to user
export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const payload = JSON.stringify({ title, body, url: url || '/', icon: '/logo.png' });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
    } catch (e) {
      // Subscription expired or invalid
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
  }
}
