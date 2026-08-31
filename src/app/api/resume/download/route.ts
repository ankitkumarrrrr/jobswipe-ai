import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: session.user.id },
    });

    if (!resume || !resume.fileData) {
      return NextResponse.json({ error: "No resume file found" }, { status: 404 });
    }

    // Decode base64 to buffer
    const buffer = Buffer.from(resume.fileData, "base64");

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": resume.fileType || "application/pdf",
        "Content-Disposition": `attachment; filename="${resume.fileName || "resume.pdf"}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("Resume download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
