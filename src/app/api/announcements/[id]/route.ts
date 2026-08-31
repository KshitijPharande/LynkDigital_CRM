import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/announcements/[id] - Remove announcement (Admin only)
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

    const item = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    await prisma.announcement.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        action: "ANNOUNCEMENT_DELETED",
        entityType: "ANNOUNCEMENT",
        details: `Deleted announcement: "${item.title}"`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
