"use server";

import { signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function loginAction(
  prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Server-side signIn handles cookie + redirect in one response
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error: any) {
    // signIn throws a NEXT_REDIRECT error on success — catch it
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: error?.message || "Login failed" };
  }
}

export async function registerAction(
  prevState: { error: string } | null,
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists" };
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        subscription: {
          create: {
            plan: "FREE",
            applicationsUsed: 0,
            applicationsLimit: 100,
          },
        },
        profile: {
          create: {
            skills: "[]",
          },
        },
      },
    });

    // Auto-login after registration — server-side redirect
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error: any) {
    // signIn throws a NEXT_REDIRECT error on success — catch it
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: error?.message || "Registration failed" };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
