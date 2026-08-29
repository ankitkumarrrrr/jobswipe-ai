import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
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
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Sync to Firebase if configured (server-side)
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.FIREBASE_SERVICE_ACCOUNT) {
        const { initializeApp, cert, getApps } = await import("firebase-admin/app");
        const { getFirestore } = await import("firebase-admin/firestore");
        
        const app = getApps().length === 0 
          ? initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
          : getApps()[0];
        
        const db = getFirestore(app);
        await db.collection("users").doc(user.id).set({
          id: user.id,
          name: user.name,
          email: user.email,
          plan: "FREE",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (firebaseError) {
      // Firebase sync is optional, don't fail registration
      console.log("Firebase sync skipped:", firebaseError instanceof Error ? firebaseError.message : "not configured");
    }

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
