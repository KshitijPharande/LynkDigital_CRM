import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/approvals - List all client approval deliverables
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const deliverableType = searchParams.get("type");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (clientId && clientId !== "ALL") {
      where.clientId = clientId;
    }

    if (deliverableType && deliverableType !== "ALL") {
      where.deliverableType = deliverableType;
    }

    const rawApprovals = await prisma.clientApproval.findMany({
      where,
      orderBy: [{ sentDate: "desc" }],
      include: {
        client: {
          select: {
            id: true,
            brandName: true,
            industry: true,
            status: true,
            accountManager: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Compute live days pending
    const approvals = rawApprovals.map((item) => {
      const now = new Date();
      const sent = new Date(item.sentDate);
      const diffTime = Math.abs(now.getTime() - sent.getTime());
      const daysPending = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...item,
        daysPending,
      };
    });

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("Fetch approvals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client approvals" },
      { status: 500 }
    );
  }
}

// POST /api/approvals - Log new deliverable
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      deliverableName,
      deliverableType = "Reel",
      sentDate,
      status = "SENT_TO_CLIENT",
      previewUrl,
      notes,
    } = body;

    if (!clientId || !deliverableName) {
      return NextResponse.json(
        { error: "Client and deliverable name are required." },
        { status: 400 }
      );
    }

    const newApproval = await prisma.clientApproval.create({
      data: {
        clientId,
        deliverableName: deliverableName.trim(),
        deliverableType: deliverableType.trim(),
        sentDate: sentDate ? new Date(sentDate) : new Date(),
        status,
        previewUrl: previewUrl?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: { client: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "APPROVAL_LOGGED",
        entityType: "APPROVAL",
        entityId: newApproval.id,
        details: `Logged deliverable "${newApproval.deliverableName}" for ${newApproval.client.brandName} (${newApproval.status})`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, approval: newApproval }, { status: 201 });
  } catch (error) {
    console.error("Create approval error:", error);
    return NextResponse.json(
      { error: "Failed to log deliverable approval" },
      { status: 500 }
    );
  }
}
