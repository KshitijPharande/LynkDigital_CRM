import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// GET /api/team - List all team members with assigned clients
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        clientAssignments: {
          include: {
            client: {
              select: {
                id: true,
                brandName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Fetch team error:", error);
    return NextResponse.json(
      { error: "Failed to load team directory" },
      { status: 500 }
    );
  }
}

// POST /api/team - Create new team member (Admin only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Administrator access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      designation,
      department,
      phone,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A team member with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || "EMPLOYEE",
        designation: designation?.trim() || "Team Member",
        department: department?.trim() || "General",
        phone: phone?.trim() || null,
        status: "ACTIVE",
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "EMPLOYEE_CREATED",
        entityType: "USER",
        entityId: newUser.id,
        details: `Created new ${newUser.role.toLowerCase()} profile for ${newUser.name} (${newUser.designation})`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Create team member error:", error);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}
