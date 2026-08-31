import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/leaves/[id] - Review leave application (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Administrator review required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, adminComment } = body;

    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED, REJECTED, or PENDING." },
        { status: 400 }
      );
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status,
        adminComment: adminComment?.trim() || null,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
        reviewedBy: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `LEAVE_${status}`,
        entityType: "LEAVE",
        entityId: updated.id,
        details: `${currentUser.name} marked ${updated.user.name}'s leave as ${status}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, leave: updated });
  } catch (error) {
    console.error("Review leave error:", error);
    return NextResponse.json(
      { error: "Failed to review leave application" },
      { status: 500 }
    );
  }
}
