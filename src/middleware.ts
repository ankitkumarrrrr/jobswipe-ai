import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't need auth
  const publicPaths = ["/login", "/register", "/", "/api/auth", "/admin"];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  
  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth v5 uses different cookie names)
  const sessionCookie = 
    request.cookies.get("next-auth.session-token") || 
    request.cookies.get("__Secure-next-auth.session-token") ||
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");
  
  // For API routes that need auth, check session
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // For dashboard pages, redirect to login if no session
  if (!sessionCookie && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
