import { NextRequest, NextResponse } from "next/server";
import { scrapeAllSources } from "@/lib/jobs/auto-scraper";

// POST: Trigger automatic job scraping
export async function POST(req: NextRequest) {
  try {
    const { keywords, location } = await req.json();

    if (!keywords) {
      return NextResponse.json({ error: "Keywords required" }, { status: 400 });
    }

    console.log(`🤖 Auto-scraping triggered: "${keywords}" in "${location || "India"}"`);

    const result = await scrapeAllSources(keywords, location || "India");

    return NextResponse.json({
      success: true,
      message: `Found ${result.jobs.length} jobs from ${result.sources.join(", ")}`,
      total: result.jobs.length,
      saved: result.totalSaved,
      sources: result.sources,
      jobs: result.jobs.slice(0, 10).map((j) => ({
        title: j.title,
        company: j.company,
        location: j.location,
        source: j.source,
      })),
    });
  } catch (error) {
    console.error("Auto-scrape error:", error);
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
  }
}

// GET: Get scraping status and stats
export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");

    const totalJobs = await prisma.job.count({ where: { isActive: true } });
    const jobsBySource = await prisma.job.groupBy({
      by: ["source"],
      _count: true,
      where: { isActive: true },
    });

    const recentJobs = await prisma.job.findMany({
      where: { isActive: true },
      orderBy: { scrapedAt: "desc" },
      take: 5,
      select: { title: true, company: true, source: true, scrapedAt: true },
    });

    return NextResponse.json({
      totalJobs,
      jobsBySource: jobsBySource.map((s) => ({
        source: s.source,
        count: s._count,
      })),
      recentJobs,
      lastScraped: recentJobs[0]?.scrapedAt || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
