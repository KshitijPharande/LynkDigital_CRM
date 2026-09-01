import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lynkdigital-crm-super-secure-production-jwt-key-2026"
);

const COOKIE_NAME = "lynk_session_token";

// Public paths that do NOT require authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow Next.js static assets and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Allow explicitly public endpoints
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path))) {
    // If user is already authenticated and visits /login, redirect to /dashboard
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token && pathname === "/login") {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Token invalid, allow login page
      }
    }
    return NextResponse.next();
  }

  // 3. Extract and verify session token
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let userPayload: {
    userId: string;
    email: string;
    role: "ADMIN" | "EMPLOYEE";
    name: string;
  } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userPayload = payload as {
        userId: string;
        email: string;
        role: "ADMIN" | "EMPLOYEE";
        name: string;
      };
    } catch {
      userPayload = null;
    }
  }

  // 4. Strict Block: If no valid token, redirect directly to /login
  if (!userPayload) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    // Clear any invalid/expired cookie
    if (token) {
      response.cookies.delete(COOKIE_NAME);
    }
    return response;
  }

  // 5. Admin-only route guards
  if (pathname.startsWith("/activity") && userPayload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
