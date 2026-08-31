import { NextResponse } from "next/server";
import { authenticateWithCredentials, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, isDemoBypass } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const authResult = await authenticateWithCredentials(
      email,
      password,
      isDemoBypass
    );

    if (!authResult.success || !authResult.token) {
      return NextResponse.json(
        { error: authResult.error || "Authentication failed" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: authResult.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
