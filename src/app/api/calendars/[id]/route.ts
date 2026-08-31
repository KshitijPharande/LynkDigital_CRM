import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/calendars/[id] - Update calendar status, deadline, or sheet link
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      month,
      year,
      googleSheetUrl,
      status,
      approvalStatus,
      nextDeadline,
    } = body;

    const updated = await prisma.contentCalendar.update({
      where: { id: params.id },
      data: {
        ...(month && { month: month.trim() }),
        ...(year && { year: Number(year) }),
        ...(googleSheetUrl && { googleSheetUrl: googleSheetUrl.trim() }),
        ...(status && { status }),
        ...(approvalStatus && { approvalStatus }),
        ...(nextDeadline !== undefined && {
          nextDeadline: nextDeadline ? new Date(nextDeadline) : null,
        }),
        lastUpdatedDate: new Date(),
      },
      include: { client: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CALENDAR_UPDATED",
        entityType: "CALENDAR",
        entityId: updated.id,
        details: `Updated ${updated.month} calendar for ${updated.client.brandName} (Status: ${updated.status})`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, calendar: updated });
  } catch (error) {
    console.error("Update calendar error:", error);
    return NextResponse.json(
      { error: "Failed to update content calendar" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendars/[id] - Delete calendar entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const cal = await prisma.contentCalendar.findUnique({
      where: { id: params.id },
      include: { client: true },
    });

    if (!cal) {
      return NextResponse.json({ error: "Calendar not found" }, { status: 404 });
    }

    await prisma.contentCalendar.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        action: "CALENDAR_DELETED",
        entityType: "CALENDAR",
        details: `Removed ${cal.month} calendar for ${cal.client.brandName}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, message: "Calendar deleted" });
  } catch (error) {
    console.error("Delete calendar error:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar" },
      { status: 500 }
    );
  }
}
