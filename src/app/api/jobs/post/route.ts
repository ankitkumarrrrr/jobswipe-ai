import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Create a new job posting
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      company,
      location,
      salaryMin,
      salaryMax,
      currency,
      jobType,
      description,
      requirements,
      contactEmail,
      contactPhone,
      contactLinkedin,
      isRemote,
    } = body;

    if (!title || !company || !description) {
      return NextResponse.json(
        { error: "Title, company, and description are required" },
        { status: 400 }
      );
    }

    const jobPosting = await prisma.jobPosting.create({
      data: {
        postedBy: session.user.id,
        title,
        company,
        location: location || "",
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        currency: currency || "INR",
        jobType: jobType || "full-time",
        description,
        requirements: JSON.stringify(requirements || []),
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        contactLinkedin: contactLinkedin || null,
        isRemote: isRemote || false,
      },
    });

    return NextResponse.json({ success: true, job: jobPosting });
  } catch (error) {
    console.error("Job posting error:", error);
    return NextResponse.json({ error: "Failed to create job posting" }, { status: 500 });
  }
}

// GET: List all active job postings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const mine = searchParams.get("mine") === "true";

    const session = await auth();

    let whereClause: any = { isActive: true };
    if (mine && session?.user?.id) {
      whereClause = { postedBy: session.user.id, isActive: true };
    }

    const jobs = await prisma.jobPosting.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        poster: {
          select: { name: true, email: true },
        },
      },
    });

    const total = await prisma.jobPosting.count({ where: whereClause });

    const mappedJobs = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      currency: j.currency,
      jobType: j.jobType,
      description: j.description,
      requirements: JSON.parse(j.requirements || "[]"),
      contactEmail: j.contactEmail,
      contactPhone: j.contactPhone,
      contactLinkedin: j.contactLinkedin,
      isRemote: j.isRemote,
      views: j.views,
      applications: j.applications,
      postedBy: j.poster?.name || "Anonymous",
      createdAt: j.createdAt,
    }));

    return NextResponse.json({ jobs: mappedJobs, total });
  } catch (error) {
    console.error("Job listing error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

// PUT: Update a job posting
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const existing = await prisma.jobPosting.findUnique({ where: { id } });
    if (!existing || existing.postedBy !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const job = await prisma.jobPosting.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE: Deactivate a job posting
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const existing = await prisma.jobPosting.findUnique({ where: { id } });
    if (!existing || existing.postedBy !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.jobPosting.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
