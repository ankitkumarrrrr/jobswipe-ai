import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const user = await prisma.user.findFirst({ where: { id: sessionToken } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalApplications, applicationsToday, applicationsThisWeek, applicationsThisMonth, sentApplications, respondedApplications, interviewApplications, emailTracks, savedJobs] = await Promise.all([
      prisma.application.count({ where: { userId: user.id } }),
      prisma.application.count({ where: { userId: user.id, createdAt: { gte: today } } }),
      prisma.application.count({ where: { userId: user.id, createdAt: { gte: thisWeek } } }),
      prisma.application.count({ where: { userId: user.id, createdAt: { gte: thisMonth } } }),
      prisma.application.count({ where: { userId: user.id, status: 'SENT' } }),
      prisma.application.count({ where: { userId: user.id, status: 'RESPONDED' } }),
      prisma.application.count({ where: { userId: user.id, status: 'INTERVIEW' } }),
      prisma.emailTrack.aggregate({ where: { userId: user.id }, _sum: { openCount: true, clickCount: true }, _count: true }),
      prisma.savedJob.count({ where: { userId: user.id } }),
    ]);

    // Applications by day (last 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentApps = await prisma.application.findMany({
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
    });

    const dailyApps: Record<string, { total: number; sent: number; responded: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyApps[key] = { total: 0, sent: 0, responded: 0 };
    }
    recentApps.forEach(app => {
      const key = app.createdAt.toISOString().split('T')[0];
      if (dailyApps[key]) {
        dailyApps[key].total++;
        if (app.status === 'SENT') dailyApps[key].sent++;
        if (app.status === 'RESPONDED' || app.status === 'INTERVIEW') dailyApps[key].responded++;
      }
    });

    // Applications by source
    const appsBySource = await prisma.application.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: true,
    });

    // Top companies applied to
    const topCompanies = await prisma.application.groupBy({
      by: ['jobId'],
      where: { userId: user.id },
      _count: true,
      orderBy: { _count: { jobId: 'desc' } },
      take: 5,
    });

    const companyIds = topCompanies.map(c => c.jobId);
    const companies = await prisma.job.findMany({ where: { id: { in: companyIds } }, select: { id: true, company: true } });
    const companyMap = new Map(companies.map(c => [c.id, c.company]));

    return NextResponse.json({
      overview: {
        totalApplications,
        applicationsToday,
        applicationsThisWeek,
        applicationsThisMonth,
        sentApplications,
        responseRate: totalApplications > 0 ? ((respondedApplications / totalApplications) * 100).toFixed(1) : '0',
        interviewRate: totalApplications > 0 ? ((interviewApplications / totalApplications) * 100).toFixed(1) : '0',
        emailOpenRate: emailTracks._count > 0 ? (((emailTracks._sum.openCount || 0) / emailTracks._count) * 100).toFixed(1) : '0',
        emailClickRate: emailTracks._count > 0 ? (((emailTracks._sum.clickCount || 0) / emailTracks._count) * 100).toFixed(1) : '0',
        totalEmailsOpened: emailTracks._sum.openCount || 0,
        totalEmailsClicked: emailTracks._sum.clickCount || 0,
        savedJobs,
      },
      chartData: Object.entries(dailyApps).map(([date, data]) => ({ date, ...data })),
      byStatus: appsBySource.map(s => ({ status: s.status, count: s._count })),
      topCompanies: topCompanies.map(c => ({ company: companyMap.get(c.jobId) || 'Unknown', count: c._count })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
