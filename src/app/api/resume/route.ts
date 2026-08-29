import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseResumeWithAI } from "@/lib/ai/resume-parser";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please login first." }, { status: 401 });
    }

    // Ensure user exists in database (handles case after DB reset)
    let user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      // Create user if not exists
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email || "unknown@email.com",
          name: session.user.name || "User",
        },
      });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use PDF or DOCX." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text based on file type
    let rawText = "";
    if (file.type === "application/pdf") {
      try {
        const pdfParseModule = await import("pdf-parse");
        const { PDFParse } = pdfParseModule as any;
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        rawText = typeof result === "string" ? result : result?.text || "";
      } catch (e) {
        console.error("PDF parse error:", e);
        // Fallback: try to extract readable text
        rawText = buffer.toString("utf-8").replace(/[^ -~\n]/g, " ");
      }
    } else if (file.type.includes("wordprocessingml")) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      } catch {
        rawText = buffer.toString("utf-8");
      }
    }

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract text from resume. Please ensure the file is not image-based." },
        { status: 422 }
      );
    }

    // Parse with AI (with local fallback)
    let parsedData;
    try {
      parsedData = await parseResumeWithAI(rawText);
    } catch (aiError) {
      console.warn("AI parsing failed, using local parser:", aiError);
      // Use local parser as fallback
      parsedData = {
        name: rawText.split("\n")[0]?.trim() || user.name || "Unknown",
        email: rawText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/)?.[0] || user.email || "",
        phone: rawText.match(/[\+]?[\d\s()-]{7,15}/)?.[0] || "",
        location: "",
        summary: rawText.substring(0, 300),
        skills: extractSkills(rawText),
        experience: extractExperience(rawText),
        education: extractEducation(rawText),
        goals: "Seeking a challenging role to leverage skills and experience",
        languages: [],
        certifications: [],
      };
    }

    // Save resume to database
    const resume = await prisma.resume.upsert({
      where: { userId: user.id },
      update: {
        fileName: file.name,
        fileUrl: `/uploads/${user.id}/${file.name}`,
        fileType: file.type,
        rawText,
        parsedData: JSON.stringify(parsedData),
      },
      create: {
        userId: user.id,
        fileName: file.name,
        fileUrl: `/uploads/${user.id}/${file.name}`,
        fileType: file.type,
        rawText,
        parsedData: JSON.stringify(parsedData),
      },
    });

    // Also update user profile with extracted data
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        skills: JSON.stringify(parsedData.skills || []),
        experience: JSON.stringify(parsedData.experience || []),
        education: JSON.stringify(parsedData.education || []),
        goals: parsedData.goals || "",
        location: parsedData.location || "",
        phone: parsedData.phone || "",
      },
      create: {
        userId: user.id,
        skills: JSON.stringify(parsedData.skills || []),
        experience: JSON.stringify(parsedData.experience || []),
        education: JSON.stringify(parsedData.education || []),
        goals: parsedData.goals || "",
        location: parsedData.location || "",
        phone: parsedData.phone || "",
      },
    });

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      parsedData,
      message: "Resume parsed successfully",
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

// GET: Fetch current user's parsed resume
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ resume: null });
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: session.user.id },
    });

    if (!resume) {
      return NextResponse.json({ resume: null });
    }

    return NextResponse.json({
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        uploadedAt: resume.uploadedAt,
        parsedData: resume.parsedData ? JSON.parse(resume.parsedData as string) : null,
      },
    });
  } catch (error) {
    console.error("Resume fetch error:", error);
    return NextResponse.json({ resume: null });
  }
}

// Local helper functions for fallback parsing
function extractSkills(text: string): string[] {
  const skillKeywords = [
    "javascript", "typescript", "python", "java", "react", "node", "angular", "vue",
    "html", "css", "sql", "mongodb", "postgresql", "mysql", "aws", "azure", "gcp",
    "docker", "kubernetes", "git", "linux", "redis", "graphql", "rest", "api",
    "next.js", "nextjs", "express", "django", "flask", "spring", "rails",
    "machine learning", "ai", "tensorflow", "pytorch", "data science",
    "figma", "sketch", "photoshop", "illustrator",
    "agile", "scrum", "jira", "confluence",
  ];
  const lower = text.toLowerCase();
  return skillKeywords.filter((s) => lower.includes(s));
}

function extractExperience(text: string): any[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const experience: any[] = [];
  const keywords = ["experience", "worked", "engineer", "developer", "manager"];
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    if (keywords.some((k) => lower.includes(k)) && i < lines.length - 1) {
      experience.push({
        title: line.trim(),
        company: lines[i + 1]?.trim() || "",
        duration: "",
        description: lines.slice(i + 2, i + 5).join(" "),
        skills: [],
      });
    }
  });
  return experience.length > 0 ? experience : [{ title: "Professional", company: "", duration: "", description: "", skills: [] }];
}

function extractEducation(text: string): any[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const education: any[] = [];
  const keywords = ["bachelor", "master", "phd", "degree", "university", "college", "b.tech", "m.tech"];
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    if (keywords.some((k) => lower.includes(k))) {
      education.push({ degree: line.trim(), institution: lines[i + 1]?.trim() || "", year: "", field: "" });
    }
  });
  return education.length > 0 ? education : [{ degree: "Education", institution: "", year: "", field: "" }];
}
