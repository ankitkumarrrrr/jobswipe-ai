import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    const totalApplications = await prisma.application.count();

    const [basicPlanUsers, premiumPlanUsers, freePlanUsers] = await Promise.all([
      prisma.subscription.count({ where: { plan: "BASIC" } }),
      prisma.subscription.count({ where: { plan: "PREMIUM" } }),
      prisma.subscription.count({ where: { plan: "FREE" } }),
    ]);

    const subscriptions = await prisma.subscription.findMany({
      select: { applicationsUsed: true },
    });

    const totalAppsUsed = subscriptions.reduce(
      (sum, sub) => sum + sub.applicationsUsed,
      0
    );

    const monthlyRevenue = basicPlanUsers * 299 + premiumPlanUsers * 499;

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscription: { select: { plan: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalApplications,
        totalAppsUsed,
        revenue: {
          monthly: monthlyRevenue,
          basic: basicPlanUsers * 299,
          premium: premiumPlanUsers * 499,
        },
        plans: {
          free: freePlanUsers,
          basic: basicPlanUsers,
          premium: premiumPlanUsers,
        },
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        plan: u.subscription?.plan || "FREE",
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
