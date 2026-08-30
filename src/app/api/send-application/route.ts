import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendApplicationEmailResend, findRecruiterEmail } from "@/lib/email-resend";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      recruiterEmail,
      jobTitle,
      companyName,
      coverLetter,
      jobId,
      jobDescription,
    } = body;

    if (!jobTitle || !companyName || !coverLetter) {
      return NextResponse.json(
        { error: "Missing required fields: jobTitle, companyName, coverLetter" },
        { status: 400 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true, resume: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine recruiter email
    let toEmail = recruiterEmail;
    if (!toEmail && jobDescription) {
      toEmail = findRecruiterEmail(jobDescription, companyName);
    }
    if (!toEmail) {
      // Generate a fallback email
      const cleanCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
      toEmail = `careers@${cleanCompany}.com`;
    }

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (
      subscription &&
      subscription.applicationsLimit !== -1 &&
      subscription.applicationsUsed >= subscription.applicationsLimit
    ) {
      return NextResponse.json(
        { error: "Application limit reached. Upgrade your plan." },
        { status: 403 }
      );
    }

    // Build resume URL if available
    const resumeUrl = user.resume?.fileUrl || undefined;

    // Send the email
    const result = await sendApplicationEmailResend({
      fromName: user.name || "Job Applicant",
      fromEmail: user.email,
      toEmail,
      jobTitle,
      companyName,
      coverLetter,
      resumeUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Save application record
    let jobRecord = null;
    if (jobId) {
      jobRecord = await prisma.job.findUnique({ where: { id: jobId } });
    }

    if (!jobRecord) {
      jobRecord = await prisma.job.create({
        data: {
          title: jobTitle,
          company: companyName,
          description: jobDescription || "",
          url: "",
          source: "manual",
        },
      });
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId: jobRecord.id,
        status: "SENT",
        coverLetter,
        emailBody: coverLetter,
        sentAt: new Date(),
      },
    });

    // Track email if we have an email ID
    if (result.emailId) {
      try {
        await prisma.emailTrack.create({
          data: {
            userId: session.user.id,
            applicationId: application.id,
            recipientEmail: toEmail,
            subject: `Application for ${jobTitle} — ${user.name || "Applicant"}`,
            trackingId: result.emailId,
          },
        });
      } catch {
        // Email tracking is optional
      }
    }

    // Increment subscription usage
    if (subscription) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { applicationsUsed: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      emailId: result.emailId,
      provider: result.provider,
      sentTo: toEmail,
      remaining: result.remaining,
      message: `Application sent to ${toEmail} via ${result.provider}`,
    });
  } catch (error: any) {
    console.error("Send application error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send application" },
      { status: 500 }
    );
  }
}
