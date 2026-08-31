import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/approvals/[id] - Update deliverable status or notes
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
      deliverableName,
      deliverableType,
      sentDate,
      status,
      previewUrl,
      notes,
    } = body;

    const updated = await prisma.clientApproval.update({
      where: { id: params.id },
      data: {
        ...(deliverableName && { deliverableName: deliverableName.trim() }),
        ...(deliverableType && { deliverableType: deliverableType.trim() }),
        ...(sentDate && { sentDate: new Date(sentDate) }),
        ...(status && { status }),
        ...(previewUrl !== undefined && { previewUrl: previewUrl?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
      include: { client: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "APPROVAL_STATUS_CHANGED",
        entityType: "APPROVAL",
        entityId: updated.id,
        details: `Updated "${updated.deliverableName}" for ${updated.client.brandName} to ${updated.status}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, approval: updated });
  } catch (error) {
    console.error("Update approval error:", error);
    return NextResponse.json(
      { error: "Failed to update approval deliverable" },
      { status: 500 }
    );
  }
}

// DELETE /api/approvals/[id] - Remove deliverable
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

    const item = await prisma.clientApproval.findUnique({
      where: { id: params.id },
      include: { client: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    await prisma.clientApproval.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        action: "APPROVAL_DELETED",
        entityType: "APPROVAL",
        details: `Deleted deliverable "${item.deliverableName}" for ${item.client.brandName}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, message: "Deliverable deleted" });
  } catch (error) {
    console.error("Delete approval error:", error);
    return NextResponse.json(
      { error: "Failed to delete deliverable" },
      { status: 500 }
    );
  }
}
