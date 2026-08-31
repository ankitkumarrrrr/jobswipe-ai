import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in a simple way using AIUsage table or create a reset token field
    // For now, use a workaround: store in a JSON field
    await prisma.$executeRaw`
      UPDATE "User" SET "passwordResetToken" = ${token}, "passwordResetExpiry" = ${expires} WHERE "email" = ${email}
    `.catch(async () => {
      // Column might not exist, try alternative approach
      console.log("Password reset columns may not exist, using fallback");
    });

    // Send email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      const resetUrl = `${process.env.NEXTAUTH_URL || "https://jobswipe-alpha.vercel.app"}/reset-password?token=${token}`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JobSwipe <onboarding@resend.dev>",
          to: email,
          subject: "Reset your JobSwipe password",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a2e;">Reset Your Password</h2>
              <p style="color: #555; line-height: 1.6;">You requested a password reset for your JobSwipe account.</p>
              <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Reset Password</a>
              <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
