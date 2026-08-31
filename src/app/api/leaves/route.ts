import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/leaves - Fetch leave applications
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const leaveType = searchParams.get("type");
    const viewAll = searchParams.get("viewAll") === "true";

    const where: any = {};

    // Non-admins only see their own leaves unless admin
    if (currentUser.role !== "ADMIN" || !viewAll) {
      where.userId = currentUser.id;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (leaveType && leaveType !== "ALL") {
      where.leaveType = leaveType;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
            role: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error("Fetch leaves error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}

// POST /api/leaves - Submit leave application
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leaveType, startDate, endDate, daysCount, reason } = body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "Leave type, dates, and reason are required." },
        { status: 400 }
      );
    }

    const newLeave = await prisma.leaveRequest.create({
      data: {
        userId: currentUser.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysCount: parseFloat(daysCount) || 1.0,
        reason: reason.trim(),
        status: "PENDING",
      },
      include: {
        user: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "LEAVE_SUBMITTED",
        entityType: "LEAVE",
        entityId: newLeave.id,
        details: `${currentUser.name} submitted a ${newLeave.leaveType} request for ${newLeave.daysCount} day(s)`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, leave: newLeave }, { status: 201 });
  } catch (error) {
    console.error("Submit leave error:", error);
    return NextResponse.json(
      { error: "Failed to submit leave request" },
      { status: 500 }
    );
  }
}
