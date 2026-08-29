import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true, resume: true, subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      profile: user.profile
        ? {
            skills: user.profile.skills ? JSON.parse(user.profile.skills as string) : [],
            experience: user.profile.experience ? JSON.parse(user.profile.experience as string) : [],
            education: user.profile.education ? JSON.parse(user.profile.education as string) : [],
            goals: user.profile.goals,
            location: user.profile.location,
            phone: user.profile.phone,
            linkedinUrl: user.profile.linkedinUrl,
          }
        : null,
      resume: user.resume
        ? {
            fileName: user.resume.fileName,
            parsedData: user.resume.parsedData ? JSON.parse(user.resume.parsedData as string) : null,
          }
        : null,
      subscription: user.subscription
        ? {
            plan: user.subscription.plan,
            applicationsUsed: user.subscription.applicationsUsed,
            applicationsLimit: user.subscription.applicationsLimit,
          }
        : null,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT: Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, location, linkedinUrl, goals } = body;

    // Update user name
    if (name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      });
    }

    // Update profile
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        phone: phone || undefined,
        location: location || undefined,
        linkedinUrl: linkedinUrl || undefined,
        goals: goals || undefined,
      },
      create: {
        userId: session.user.id,
        phone: phone || "",
        location: location || "",
        linkedinUrl: linkedinUrl || "",
        goals: goals || "",
        skills: "[]",
      },
    });

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
