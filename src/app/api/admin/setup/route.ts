import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Set a user as admin (for first-time setup)
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Only allow specific admin email
    if (email !== "ankit176424@gmail.com") {
      return NextResponse.json({ error: "Unauthorized email" }, { status: 403 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create user if not exists
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(password, 12);

      user = await prisma.user.create({
        data: {
          email,
          name: "Admin",
          passwordHash,
          role: "admin",
          subscription: {
            create: {
              plan: "FREE",
              applicationsUsed: 0,
              applicationsLimit: 5,
            },
          },
          profile: {
            create: {
              skills: "[]",
            },
          },
        },
      });
    } else {
      // Update existing user to admin + update password
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "admin", passwordHash },
      });
    }

    return NextResponse.json({ success: true, message: "Admin user set up", userId: user.id });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
