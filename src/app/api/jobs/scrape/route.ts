import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchAllFreeAPIs } from "@/lib/jobs/free-apis";

// GET: Fetch jobs from database
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "30");
    const source = searchParams.get("source");

    const where: any = { isActive: true };
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { company: { contains: query } },
        { description: { contains: query } },
      ];
    }
    if (source) where.source = source;

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { scrapedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ jobs, total: jobs.length });
  } catch (error) {
    console.error("Job fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

// POST: Search for new jobs using free APIs
export async function POST(req: NextRequest) {
  try {
    const { keywords, location } = await req.json();

    if (!keywords) {
      return NextResponse.json({ error: "Keywords required" }, { status: 400 });
    }

    console.log(`Searching jobs: ${keywords} in ${location || "India"}`);

    // Search all free APIs
    const { jobs: freeJobs, sources } = await searchAllFreeAPIs(
      keywords,
      location || "India"
    );

    // Also search with Gemini AI for more results
    let geminiJobs: any[] = [];
    try {
      const { getGeminiModel } = await import("@/lib/ai/gemini");
      const model = getGeminiModel();

      const prompt = `Find 10 current job listings for "${keywords}" in "${location || "India"}".
For each job provide:
- title (real job title)
- company (REAL company name)
- location
- description (2-3 sentences)
- url (actual link to job posting or company careers page)
- salary (if available, format as "₹X - ₹Y" or "$X - $Y")

Return JSON: {"jobs":[{"title":"","company":"","location":"","description":"","url":"","salary":""}]}

IMPORTANT: Only real companies and realistic job titles.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const text = result.response.text();
      const data = JSON.parse(text);
      geminiJobs = data.jobs || [];
      sources.push("Gemini AI");
    } catch (e) {
      console.log("Gemini search failed:", e);
    }

    // Combine all jobs
    const allJobs = [...freeJobs, ...geminiJobs];

    // Save to database
    let savedCount = 0;
    for (const job of allJobs) {
      try {
        await prisma.job.create({
          data: {
            title: job.title,
            company: job.company,
            location: job.location || "",
            description: job.description || "",
            requirements: "[]",
            url: job.url || "",
            source: job.source || "web",
            salaryMin: job.salary || null,
          },
        });
        savedCount++;
      } catch {
        // Duplicate or error, skip
      }
    }

    console.log(
      `Found ${allJobs.length} jobs from ${sources.join(", ")}, saved ${savedCount} new`
    );

    return NextResponse.json({
      success: true,
      jobs: allJobs,
      total: allJobs.length,
      saved: savedCount,
      sources,
    });
  } catch (error) {
    console.error("Job search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
