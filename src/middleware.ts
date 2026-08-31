import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lynkdigital-crm-jwt-secret-key-32-chars-long-secure"
);

const COOKIE_NAME = "lynk_session_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, api routes, and next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

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

  // Redirect to dashboard if logged in user visits /login
  if (pathname === "/login") {
    if (userPayload) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected application routes
  const protectedRoutes = [
    "/dashboard",
    "/clients",
    "/calendars",
    "/approvals",
    "/team",
    "/leaves",
    "/announcements",
    "/activity",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !userPayload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only route guard
  if (pathname.startsWith("/activity") && userPayload?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
