import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Find user by token
    const users = await prisma.$queryRaw`
      SELECT "id", "email" FROM "User"
      WHERE "passwordResetToken" = ${token}
      AND "passwordResetExpiry" > NOW()
    ` as any[];

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const user = users[0];
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$executeRaw`
      UPDATE "User"
      SET "passwordHash" = ${passwordHash}, "passwordResetToken" = NULL, "passwordResetExpiry" = NULL
      WHERE "id" = ${user.id}
    `.catch(async () => {
      // Fallback if columns don't exist
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
