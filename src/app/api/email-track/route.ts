import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - List tracked emails for user, OR track email open (1x1 pixel)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const trackId = url.searchParams.get('id');

    // If tracking pixel request (has id param)
    if (trackId) {
      await prisma.emailTrack.update({
        where: { trackingId: trackId },
        data: { openedAt: new Date(), openCount: { increment: 1 } },
      }).catch(() => {});

      // Return 1x1 transparent pixel
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      return new NextResponse(pixel, {
        headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    // Otherwise, list all tracked emails for the current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tracks = await prisma.emailTrack.findMany({
      where: { userId: session.user.id },
      include: {
        application: {
          include: { job: true },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    const stats = {
      total: tracks.length,
      opened: tracks.filter(t => t.openedAt).length,
      clicked: tracks.filter(t => t.clickedAt).length,
      openRate: tracks.length > 0 ? Math.round((tracks.filter(t => t.openedAt).length / tracks.length) * 100) : 0,
    };

    return NextResponse.json({ tracks, stats });
  } catch (error) {
    console.error('Email track fetch error:', error);
    return NextResponse.json({ tracks: [], stats: { total: 0, opened: 0, clicked: 0, openRate: 0 } });
  }
}

// POST - Create tracking record
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { applicationId, recipientEmail, subject } = await req.json();
    const trackingId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const track = await prisma.emailTrack.create({
      data: {
        userId: sessionToken,
        applicationId,
        recipientEmail,
        subject,
        trackingId,
      },
    });

    const origin = req.headers.get('origin') || 'http://localhost:3001';
    const trackingPixel = `${origin}/api/email-track?id=${trackingId}`;

    return NextResponse.json({ trackingId, trackingPixel });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Track email click
export async function PUT(req: NextRequest) {
  try {
    const { trackId } = await req.json();
    if (trackId) {
      await prisma.emailTrack.update({
        where: { trackingId: trackId },
        data: { clickedAt: new Date(), clickCount: { increment: 1 } },
      }).catch(() => {});
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
