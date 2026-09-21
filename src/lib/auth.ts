import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CurrentUser } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lynkdigital-crm-jwt-secret-key-32-chars-long-secure"
);

const COOKIE_NAME = "lynk_session_token";

export async function signToken(payload: {
  userId: string;
  email: string;
  role: string;
  name: string;
  designation?: string;
  department?: string;
  avatar?: string | null;
  phone?: string | null;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as {
      userId: string;
      email: string;
      role: "ADMIN" | "EMPLOYEE";
      name: string;
      designation?: string;
      department?: string;
      avatar?: string | null;
      phone?: string | null;
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.userId) return null;

    // Instant zero-database-latency return from cryptographically verified JWT (< 1ms)
    if (payload.email && payload.name && payload.role) {
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role as "ADMIN" | "EMPLOYEE",
        designation: payload.designation || "Team Member",
        department: payload.department || "General",
        avatar: payload.avatar || null,
        phone: payload.phone || null,
      };
    }

    // Fallback for legacy tokens without embedded profile fields
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        department: true,
        avatar: true,
        phone: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "EMPLOYEE",
      designation: user.designation,
      department: user.department,
      avatar: user.avatar,
      phone: user.phone,
    };
  } catch (error) {
    console.error("Error getting session user:", error);
    return null;
  }
}

export async function authenticateWithCredentials(
  email: string,
  password?: string,
  isDemoBypass: boolean = false
) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || user.status !== "ACTIVE") {
    return { success: false, error: "User not found or account is inactive." };
  }

  if (!isDemoBypass && password) {
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid password." };
    }
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    designation: user.designation,
    department: user.department,
    avatar: user.avatar,
    phone: user.phone,
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      designation: user.designation,
      department: user.department,
      avatar: user.avatar,
      phone: user.phone,
    },
  };
}

export { COOKIE_NAME };
