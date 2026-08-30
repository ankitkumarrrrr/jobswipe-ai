import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // Get subscriptions
    const subs = await prisma.subscription.findMany();
    const subMap = new Map(subs.map((s) => [s.userId, s]));

    // Application counts
    const appCounts = await prisma.application.groupBy({ by: ["userId"], _count: { id: true } });
    const appCountMap = new Map(appCounts.map((a) => [a.userId, a._count.id]));

    // Email track counts
    const emailCounts = await prisma.emailTrack.groupBy({ by: ["userId"], _count: { id: true } });
    const emailCountMap = new Map(emailCounts.map((e) => [e.userId, e._count.id]));

    // Build plan stats
    const plans = { free: 0, basic: 0, premium: 0 };
    let totalAppsUsed = 0;
    let revenue = { monthly: 0, basic: 0, premium: 0 };

    for (const sub of subs) {
      const plan = (sub.plan || "FREE").toLowerCase();
      if (plan === "basic") { plans.basic++; revenue.basic += 299; }
      else if (plan === "premium") { plans.premium++; revenue.premium += 499; }
      else { plans.free++; }
      totalAppsUsed += sub.applicationsUsed || 0;
    }
    revenue.monthly = revenue.basic + revenue.premium;

    // Get all applications with details
    const applications = await prisma.application.findMany({
      include: {
        job: { select: { title: true, company: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Get all email tracks
    const tracks = await prisma.emailTrack.findMany({
      include: {
        user: { select: { name: true, email: true } },
        application: { include: { job: { select: { company: true } } } },
      },
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    const emailsList = tracks.map((t) => ({
      id: t.id,
      userName: t.user?.name || "Unknown",
      recipientEmail: t.recipientEmail,
      company: t.application?.job?.company || "Unknown",
      subject: t.subject || "",
      sentAt: t.sentAt?.toLocaleString() || "",
      opened: (t.openCount || 0) > 0,
    }));

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        totalApplications: applications.length,
        totalAppsUsed,
        revenue,
        plans,
      },
      recentUsers: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt?.toLocaleDateString() || "—",
        plan: subMap.get(u.id)?.plan || "FREE",
        applications: appCountMap.get(u.id) || 0,
        emailsSent: emailCountMap.get(u.id) || 0,
      })),
      applications: applications.map((a) => ({
        id: a.id,
        userName: a.user?.name || "Unknown",
        userEmail: a.user?.email || "",
        jobTitle: a.job?.title || "Position",
        company: a.job?.company || "Unknown",
        status: a.status,
        sentAt: a.sentAt?.toLocaleString() || null,
      })),
      emails: emailsList,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}