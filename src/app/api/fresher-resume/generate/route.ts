import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { personal, education, skills, projects, certifications, summary, targetRole } = data;

    // Build a structured resume content
    const resumeContent = await generateResumeContent(data);

    // Save as a resume version
    const resumeVersion = await prisma.resumeVersion.create({
      data: {
        userId: session.user.id,
        name: `Fresher Resume — ${targetRole || "General"}`,
        originalResume: resumeContent,
        customizedFor: targetRole || "General",
        skills: JSON.stringify(skills || []),
        experience: JSON.stringify(projects || []),
        education: JSON.stringify(education || []),
        goals: summary || "",
      },
    });

    // Also update profile with the resume data
    try {
      await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        update: {
          skills: JSON.stringify(skills || []),
          experience: JSON.stringify(projects || []),
          education: JSON.stringify(education || []),
          goals: summary || "",
          phone: personal?.phone || "",
          location: personal?.location || "",
          linkedinUrl: personal?.linkedin || "",
        },
        create: {
          userId: session.user.id,
          skills: JSON.stringify(skills || []),
          experience: JSON.stringify(projects || []),
          education: JSON.stringify(education || []),
          goals: summary || "",
          phone: personal?.phone || "",
          location: personal?.location || "",
          linkedinUrl: personal?.linkedin || "",
        },
      });
    } catch {
      // Profile save is optional
    }

    return NextResponse.json({
      success: true,
      resumeId: resumeVersion.id,
      message: "Resume generated and saved successfully",
    });
  } catch (error: any) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate resume" }, { status: 500 });
  }
}

async function generateResumeContent(data: any): Promise<string> {
  const { personal, education, skills, projects, certifications, summary, targetRole } = data;

  const educationText = education?.map((e: any) => [
    `${e.degree}${e.stream ? " in " + e.stream : ""}`,
    e.institution,
    e.year,
    e.cgpa ? `CGPA: ${e.cgpa}` : "",
  ].filter(Boolean).join(" | ")).join("\n") || "";

  const skillsText = skills?.join(" · ") || "";

  const projectsText = projects?.filter((p: any) => p.name).map((p: any) => {
    const lines = [p.name];
    if (p.techStack) lines.push(`Tech Stack: ${p.techStack}`);
    if (p.description) lines.push(p.description);
    if (p.link) lines.push(`Link: ${p.link}`);
    return lines.join("\n  ");
  }).join("\n\n") || "";

  const certsText = certifications?.filter((c: any) => c.name).map((c: any) =>
    `${c.name}${c.issuer ? " — " + c.issuer : ""}${c.year ? " (" + c.year + ")" : ""}`
  ).join("\n") || "";

  // Try AI enhancement
  let enhancedContent = "";
  try {
    const systemPrompt = `You are a professional resume writer. Convert the provided resume data into a clean, ATS-friendly text resume format for a fresher student. Use proper formatting with sections. Do NOT include work experience section since this is a fresher resume. Make it compelling and professional.`;

    const userPrompt = `Create an ATS-friendly resume for: ${targetRole || "Software Engineer"}

Name: ${personal?.name || "Student"}
Email: ${personal?.email || ""}
Phone: ${personal?.phone || ""}
Location: ${personal?.location || ""}
LinkedIn: ${personal?.linkedin || ""}
GitHub: ${personal?.github || ""}

Professional Summary:
${summary || "Motivated student seeking opportunities to apply technical skills."}

Education:
${educationText}

Skills: ${skillsText}

Projects:
${projectsText}

Certifications:
${certsText}`;

    enhancedContent = await generateText(systemPrompt, userPrompt, 0.3);
  } catch {
    // Fall back to manual formatting
    enhancedContent = buildManualResume(data);
  }

  return enhancedContent || buildManualResume(data);
}

function buildManualResume(data: any): string {
  const { personal, education, skills, projects, certifications, summary } = data;
  const lines: string[] = [];

  lines.push(`${(personal?.name || "Your Name").toUpperCase()}`);
  lines.push([personal?.email, personal?.phone, personal?.location].filter(Boolean).join(" | "));
  if (personal?.linkedin) lines.push(`LinkedIn: ${personal.linkedin}`);
  if (personal?.github) lines.push(`GitHub: ${personal.github}`);
  lines.push("");

  if (summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push(summary);
    lines.push("");
  }

  if (education?.length > 0) {
    lines.push("EDUCATION");
    education.forEach((e: any) => {
      lines.push(`${e.degree}${e.stream ? " in " + e.stream : ""} | ${e.institution || ""} | ${e.year || ""}${e.cgpa ? " | CGPA: " + e.cgpa : ""}`);
    });
    lines.push("");
  }

  if (skills?.length > 0) {
    lines.push("TECHNICAL SKILLS");
    lines.push(skills.join(", "));
    lines.push("");
  }

  if (projects?.some((p: any) => p.name)) {
    lines.push("PROJECTS");
    projects.filter((p: any) => p.name).forEach((p: any) => {
      lines.push(p.name);
      if (p.techStack) lines.push(`Tech Stack: ${p.techStack}`);
      if (p.description) lines.push(p.description);
      if (p.link) lines.push(`Link: ${p.link}`);
      lines.push("");
    });
  }

  if (certifications?.some((c: any) => c.name)) {
    lines.push("CERTIFICATIONS");
    certifications.filter((c: any) => c.name).forEach((c: any) => {
      lines.push(`${c.name}${c.issuer ? " — " + c.issuer : ""}${c.year ? " (" + c.year + ")" : ""}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}
