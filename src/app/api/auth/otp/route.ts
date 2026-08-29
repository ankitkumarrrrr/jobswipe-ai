import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST: Send OTP to phone/email
export async function POST(req: NextRequest) {
  try {
    const { phone, email, purpose } = await req.json();

    if (!phone && !email) {
      return NextResponse.json({ error: "Phone or email required" }, { status: 400 });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await prisma.oTP.create({
      data: {
        phone: phone || email,
        code,
        purpose: purpose || "login",
        expiresAt,
      },
    });

    // Try to send via SMS (MSG91 free tier for India)
    let smsSent = false;
    if (phone) {
      try {
        // MSG91 API - Free tier: 100 SMS/month for India
        const msg91AuthKey = process.env.MSG91_AUTH_KEY;
        if (msg91AuthKey) {
          const res = await fetch("https://api.msg91.com/api/v5/otp", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "authkey": msg91AuthKey,
            },
            body: JSON.stringify({
              mobile: phone.replace(/\D/g, ""),
              otp: code,
              message: `Your JobSwipe verification code is ${code}. Valid for 10 minutes.`,
              expiry: "10",
            }),
          });
          if (res.ok) smsSent = true;
        }
      } catch (e) {
        console.log("SMS sending failed:", e);
      }
    }

    // Always send via email as backup
    let emailSent = false;
    if (email || !smsSent) {
      try {
        const { sendEmail } = await import("@/lib/email");
        const recipient = email || phone;
        emailSent = await sendEmail({
          to: recipient,
          subject: `Your JobSwipe Verification Code: ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; text-align: center;">
              <h2 style="color: #6d28d9;">JobSwipe Verification</h2>
              <p>Your verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #6d28d9; letter-spacing: 8px; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                ${code}
              </div>
              <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
          `,
        });
      } catch (e) {
        console.log("Email OTP sending failed:", e);
      }
    }

    // For demo/development: log the OTP
    console.log(`📱 OTP for ${phone || email}: ${code}`);

    return NextResponse.json({
      success: true,
      message: smsSent ? "OTP sent via SMS" : emailSent ? "OTP sent via email" : "OTP generated",
      // In development, return the OTP for testing
      ...(process.env.NODE_ENV === "development" && { otp: code }),
      expiresAt,
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

// PUT: Verify OTP
export async function PUT(req: NextRequest) {
  try {
    const { phone, email, code, purpose } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "OTP code required" }, { status: 400 });
    }

    const identifier = phone || email;

    // Find the latest OTP for this phone/email
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: identifier,
        code,
        purpose: purpose || "login",
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Mark OTP as verified
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Check if user exists with this phone/email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { profile: { phone: identifier } },
        ],
      },
    });

    // If signup, create user if not exists
    if (!user && purpose === "signup") {
      // Create user with phone as identifier
      user = await prisma.user.create({
        data: {
          email: identifier.includes("@") ? identifier : `${identifier}@phone.users`,
          name: "User",
          subscription: {
            create: {
              plan: "FREE",
              applicationsUsed: 0,
              applicationsLimit: 5,
            },
          },
          profile: {
            create: {
              phone: identifier,
              skills: "[]",
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      isNewUser: !user,
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "OTP verification failed" }, { status: 500 });
  }
}
