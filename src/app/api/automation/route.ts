import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findCompanyContacts,
  generateLinkedInMessage,
  generateApplicationEmail,
  customizeResumeForJob,
  generateCoverLetter,
} from "@/lib/ai/automation";
import { sendApplicationEmailResend } from "@/lib/email-resend";
import type { ParsedResume } from "@/lib/ai/resume-parser";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, jobTitle, company, jobDescription, salaryMin, salaryMax, location, source, url } = await req.json();

    if (!jobTitle || !company) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user data
    const [resume, user, subscription] = await Promise.all([
      prisma.resume.findUnique({ where: { userId: session.user.id } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
      prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    ]);

    // Allow application even without resume - use basic user data
    let resumeData: ParsedResume;
    if (resume?.parsedData) {
      resumeData = JSON.parse(resume.parsedData as string);
    } else {
      // Create basic resume data from user profile
      const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } });
      resumeData = {
        name: user?.name || "Job Applicant",
        email: user?.email || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
        summary: profile?.goals || `Interested in the ${jobTitle} position at ${company}.`,
        skills: profile?.skills ? JSON.parse(profile.skills as string) : [],
        experience: profile?.experience ? JSON.parse(profile.experience as string) : [],
        education: profile?.education ? JSON.parse(profile.education as string) : [],
        goals: profile?.goals || "",
      };
    }

    // Check subscription limits
    if (subscription && subscription.applicationsLimit !== -1) {
      if (subscription.applicationsUsed >= subscription.applicationsLimit) {
        return NextResponse.json({ error: "Application limit reached. Upgrade your plan." }, { status: 403 });
      }
    }

    // Save job record
    let jobRecord;
    const existingJob = jobId ? await prisma.job.findUnique({ where: { id: jobId } }) : null;
    if (existingJob) {
      jobRecord = existingJob;
    } else {
      jobRecord = await prisma.job.create({
        data: {
          title: jobTitle,
          company,
          location: location || "",
          salaryMin: salaryMin || null,
          salaryMax: salaryMax || null,
          description: jobDescription || "",
          url: url || "",
          source: source || "manual",
        },
      });
    }

    // Find company contacts (AI-generated with email patterns)
    let contacts;
    try {
      contacts = await findCompanyContacts(company, jobTitle);
    } catch (aiError) {
      console.error("AI contact finding failed:", aiError);
      contacts = [{
        name: "Hiring Manager",
        title: "Talent Acquisition",
        email: `hr@${company.toLowerCase().replace(/\s+/g, "")}.com`,
        emailVerified: false,
        linkedinSearchUrl: `https://www.google.com/search?q=site:linkedin.com/in+"${encodeURIComponent(company)}"+"hiring+manager"`,
        linkedinProfileUrl: null,
        company,
        confidence: "low" as const,
        notes: `Search LinkedIn for hiring managers at ${company}`,
      }];
    }

    // Generate materials and AUTO-SEND for each contact
    const actions = [];
    for (const contact of contacts.slice(0, 5)) {
      let linkedinMessage = "";
      let emailSubject = "";
      let emailBody = "";

      try {
        linkedinMessage = await generateLinkedInMessage(resumeData, jobTitle, company, contact.name, contact.title);
      } catch {
        linkedinMessage = `Hi ${contact.name || "there"}, I'm interested in the ${jobTitle} position at ${company}. I'd love to connect and discuss how my experience aligns with your team's needs.`;
      }

      try {
        const email = await generateApplicationEmail(resumeData, jobTitle, company, contact.name);
        emailSubject = email.subject;
        emailBody = email.body;
      } catch {
        emailSubject = `Application for ${jobTitle} — ${resumeData.name}`;
        emailBody = `Dear ${contact.name || "Hiring Manager"},\n\nI am writing to express my strong interest in the ${jobTitle} position at ${company}. With my background in ${resumeData.skills.slice(0, 3).join(", ")}, I believe I can make a meaningful contribution to your team.\n\n${resumeData.summary}\n\nI would welcome the opportunity to discuss this role further.\n\nBest regards,\n${resumeData.name}\n${resumeData.email}`;
      }

      // AUTO-SEND email to recruiter via Resend
      let emailSent = false;
      if (contact.email) {
        try {
          // Create simple text resume to attach
          const resumeText = [
            resumeData.name,
            resumeData.email + " | " + resumeData.phone,
            resumeData.location,
            "",
            "PROFESSIONAL SUMMARY",
            resumeData.summary,
            "",
            "SKILLS",
            resumeData.skills.join(", "),
            "",
            "EXPERIENCE",
            ...resumeData.experience.map((e: any) => [
              `${e.title} at ${e.company} (${e.duration})`,
              e.description,
              ""
            ].join("\n")),
            "",
            "EDUCATION",
            ...resumeData.education.map((e: any) => `${e.degree} - ${e.institution} (${e.year})`),
          ].join("\n");
          
          const resumeBuffer = Buffer.from(resumeText, "utf-8");
          
          const result = await sendApplicationEmailResend({
            fromName: resumeData.name,
            fromEmail: user?.email || resumeData.email,
            toEmail: contact.email,
            jobTitle,
            companyName: company,
            coverLetter: emailBody,
            resumeBuffer,
            resumeFileName: `${resumeData.name.replace(/\s+/g, "_")}_Resume.pdf`,
          });
          
          emailSent = result.success;
          if (emailSent) {
            console.log(`✅ Email sent to ${contact.email} at ${company} from ${user?.email} via ${result.provider}`);
          } else {
            console.log(`❌ Email failed to ${contact.email}: ${result.error}`);
          }
        } catch (e) {
          console.error(`Email sending exception for ${contact.email}:`, e);
        }
      }

      actions.push({
        type: "outreach",
        recipient: contact.name,
        title: contact.title,
        email: contact.email,
        emailVerified: contact.emailVerified || false,
        linkedinSearchUrl: contact.linkedinSearchUrl,
        linkedinProfileUrl: contact.linkedinProfileUrl,
        linkedinMessage,
        emailSubject,
        emailBody,
        emailSent,
        confidence: contact.confidence,
        notes: contact.notes,
        status: emailSent ? "sent" : "pending",
      });
    }

    // Generate customized resume
    let customizedResume = "";
    try {
      customizedResume = await customizeResumeForJob(resumeData, jobTitle, jobDescription || "", company);
    } catch {
      customizedResume = `Customized resume for ${jobTitle} at ${company}\n\n${resumeData.name}\n${resumeData.email} | ${resumeData.phone}\n${resumeData.location}\n\nSkills: ${resumeData.skills.join(", ")}\n\n${resumeData.summary}`;
    }

    // Generate cover letter
    let coverLetter = "";
    try {
      coverLetter = await generateCoverLetter(resumeData, jobTitle, jobDescription || "", company);
    } catch {
      coverLetter = `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${company}. ${resumeData.summary}\n\nI would love the opportunity to contribute to your team.\n\nBest regards,\n${resumeData.name}`;
    }

    // Save application
    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId: jobRecord.id,
        status: "SENT",
        customizedResume,
        coverLetter,
        emailBody: actions[0]?.emailBody || "",
        linkedinMessage: actions[0]?.linkedinMessage || "",
        sentAt: new Date(),
      },
    });

    // Increment usage
    if (subscription) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { applicationsUsed: { increment: 1 } },
      });
    }

    // Track AI usage
    try {
      await prisma.aIUsage.create({
        data: {
          userId: session.user.id,
          action: "automation",
          tokens: (customizedResume.length + coverLetter.length) / 4,
        },
      });
    } catch {}

    const emailsSent = actions.filter((a) => a.emailSent).length;

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      jobId: jobRecord.id,
      contacts: actions,
      customizedResume,
      coverLetter,
      emailsSent,
      totalContacts: actions.length,
      message: emailsSent > 0
        ? `AI sent ${emailsSent} emails to recruiters at ${company} from ${user?.email || "your email"}. They can reply directly to you!`
        : `AI found ${actions.length} contacts at ${company} and generated personalized outreach. LinkedIn messages ready to copy.`,
    });
  } catch (error) {
    console.error("Automation error:", error);
    return NextResponse.json({ error: "Automation failed" }, { status: 500 });
  }
}

// GET: List all applications
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      include: { job: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json({ error: "Failed to list applications" }, { status: 500 });
  }
}
