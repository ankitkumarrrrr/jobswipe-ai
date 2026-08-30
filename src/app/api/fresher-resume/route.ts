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
    const { personal, education, skills, projects, certifications, targetRole } = data;

    const systemPrompt = `You are an expert resume writer specializing in helping fresh graduates and students with no work experience craft compelling professional summaries.

Rules:
- Write a 3-4 sentence professional summary
- Focus on education, skills, and projects (not work experience)
- Use strong action verbs and confident language
- Mention the target role specifically
- Highlight relevant technical skills
- Keep it concise and impactful
- Do NOT use generic phrases like "hard-working" or "team player"
- Make it sound professional but not overly formal
- Include measurable outcomes from projects if mentioned
- Maximum 100 words`;

    const educationText = education?.map((e: any) => `${e.degree} in ${e.stream || ""} from ${e.institution} (${e.year || ""}), CGPA: ${e.cgpa || "N/A"}`).join("\n") || "Not specified";
    const projectsText = projects?.filter((p: any) => p.name).map((p: any) => `${p.name}: ${p.description} (Tech: ${p.techStack || "N/A"})`).join("\n") || "Not specified";
    const certsText = certifications?.filter((c: any) => c.name).map((c: any) => `${c.name} from ${c.issuer} (${c.year || ""})`).join("\n") || "None";

    const userPrompt = `Write a professional summary for a fresher student applying for: ${targetRole || "Software Engineer"}

Personal: ${personal?.name || "Student"}, ${personal?.location || "India"}

Education:
${educationText}

Skills: ${skills?.join(", ") || "Not specified"}

Projects:
${projectsText}

Certifications:
${certsText}`;

    let summary: string;
    try {
      summary = await generateText(systemPrompt, userPrompt, 0.7);
    } catch (aiError) {
      console.warn("AI summary generation failed, using fallback:", aiError);
      // Generate a template summary based on available data
      summary = generateFallbackSummary(targetRole, skills, education, projects);
    }

    // Also save to user profile
    try {
      await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        update: { goals: summary },
        create: { userId: session.user.id, goals: summary },
      });
    } catch {
      // Profile save is optional
    }

    return NextResponse.json({ summary: summary.trim() });
  } catch (error: any) {
    console.error("Summary generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}

function generateFallbackSummary(targetRole: string, skills: string[], education: any[], projects: any[]): string {
  const role = targetRole || "Software Engineer";
  const topSkills = skills?.slice(0, 5).join(", ") || "programming and problem-solving";
  const degree = education?.[0]?.degree || "computer science";
  const institution = education?.[0]?.institution || "a reputed university";
  const projectCount = projects?.filter((p: any) => p.name).length || 0;
  const hasProjects = projectCount > 0;

  return `Motivated ${degree} graduate from ${institution} with strong fundamentals in ${topSkills}. Passionate about building innovative solutions and eager to contribute as a ${role}. ${hasProjects ? `Demonstrated practical skills through ${projectCount} project${projectCount > 1 ? "s" : ""} involving real-world problem solving.` : "Eager to apply academic knowledge to real-world challenges."} Quick learner with a growth mindset, seeking to leverage technical skills and academic knowledge in a dynamic engineering team.`;
}
