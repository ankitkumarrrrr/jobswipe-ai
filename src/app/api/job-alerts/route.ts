import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getGeminiModel } from '@/lib/ai/gemini';
import { sendEmail } from '@/lib/email';

const prisma = new PrismaClient();

// GET - Get user's alerts
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const alerts = await prisma.jobAlert.findMany({
      where: { userId: sessionToken },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update alert
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { action, alertId, keywords, location, frequency } = await req.json();

    if (action === 'create') {
      const alert = await prisma.jobAlert.create({
        data: { userId: sessionToken, keywords, location, frequency: frequency || 'daily' },
      });
      return NextResponse.json({ alert });
    }

    if (action === 'toggle' && alertId) {
      const alert = await prisma.jobAlert.findFirst({ where: { id: alertId, userId: sessionToken } });
      if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

      await prisma.jobAlert.update({ where: { id: alertId }, data: { isActive: !alert.isActive } });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete' && alertId) {
      await prisma.jobAlert.deleteMany({ where: { id: alertId, userId: sessionToken } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send daily digest (called by cron)
export async function sendDailyDigest() {
  const alerts = await prisma.jobAlert.findMany({
    where: { isActive: true },
    include: { user: { select: { email: true, name: true } } },
  });

  for (const alert of alerts) {
    try {
      // Find matching jobs
      const jobs = await prisma.job.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: alert.keywords } },
            { description: { contains: alert.keywords } },
          ],
        },
        take: 10,
        orderBy: { scrapedAt: 'desc' },
      });

      if (jobs.length === 0) continue;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">🔔 Your Daily Job Alert</h2>
          <p>Hi ${alert.user.name || 'there'},</p>
          <p>We found <strong>${jobs.length} new jobs</strong> matching "${alert.keywords}"${alert.location ? ` in ${alert.location}` : ''}:</p>
          ${jobs.map((job, i) => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0;">
              <h3 style="margin: 0 0 4px 0;">${job.title}</h3>
              <p style="margin: 0 0 4px 0; color: #6b7280;">${job.company} • ${job.location || 'Remote'}</p>
              <a href="${job.url}" style="color: #f97316; text-decoration: none;">View Job →</a>
            </div>
          `).join('')}
          <p style="color: #9ca3af; font-size: 12px;">Sent by JobSwipe AI • <a href="http://localhost:3001/settings">Manage alerts</a></p>
        </div>
      `;

      await sendEmail({ to: alert.user.email, subject: `🔔 ${jobs.length} New Jobs: ${alert.keywords}`, html: emailHtml });

      await prisma.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: new Date() } });
    } catch (e) {
      console.error('Error sending digest:', e);
    }
  }
}
