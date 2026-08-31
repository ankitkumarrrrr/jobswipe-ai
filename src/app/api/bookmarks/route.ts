import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List bookmarked jobs
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SavedJob stores all swipes. Filter for bookmarks (right swipe = "like")
    const savedJobs = await prisma.savedJob.findMany({
      where: {
        userId: session.user.id,
        action: "like",
      },
      orderBy: { createdAt: "desc" },
    });

    // Get job details from JobPosting
    const jobIds = savedJobs.map(s => s.jobId);
    const jobs = await prisma.$queryRaw`
      SELECT id, title, company, location, "salaryMin", "salaryMax", "jobType", "isRemote", "createdAt"
      FROM "JobPosting"
      WHERE id = ANY(${jobIds})
    ` as any[];

    // Merge bookmark info with job details
    const bookmarks = savedJobs.map(s => {
      const job = jobs.find((j: any) => j.id === s.jobId);
      return {
        bookmarkId: s.id,
        ...job,
        bookmarkedAt: s.createdAt,
      };
    }).filter(b => b.id);

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Fetch bookmarks error:", error);
    return NextResponse.json({ bookmarks: [] });
  }
}

// POST: Toggle bookmark
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const existing = await prisma.savedJob.findFirst({
      where: { userId: session.user.id, jobId, action: "like" },
    });

    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, bookmarked: false });
    }

    await prisma.savedJob.create({
      data: { userId: session.user.id, jobId, action: "like" },
    });
    return NextResponse.json({ success: true, bookmarked: true });
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
