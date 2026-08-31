import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/clients/[id] - Fetch single client with full details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        accountManager: {
          select: { id: true, name: true, email: true, designation: true, phone: true },
        },
        teamAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                designation: true,
                department: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        contentCalendars: {
          orderBy: [{ year: "desc" }, { createdAt: "desc" }],
        },
        approvals: {
          orderBy: { sentDate: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Fetch client error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id] - Update client details
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
      brandName,
      industry,
      contactPerson,
      contactEmail,
      contactPhone,
      accountManagerId,
      status,
      priority,
      services,
      internalNotes,
      googleDriveFolder,
      brandGuidelinesUrl,
      clientBriefUrl,
      campaignDocsUrl,
      teamMembers, // Optional updated array of { userId, role }
    } = body;

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...(brandName && { brandName: brandName.trim() }),
        ...(industry && { industry: industry.trim() }),
        ...(contactPerson && { contactPerson: contactPerson.trim() }),
        ...(contactEmail && { contactEmail: contactEmail.trim().toLowerCase() }),
        ...(contactPhone && { contactPhone: contactPhone.trim() }),
        ...(accountManagerId !== undefined && { accountManagerId }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(services !== undefined && { services }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(googleDriveFolder !== undefined && { googleDriveFolder }),
        ...(brandGuidelinesUrl !== undefined && { brandGuidelinesUrl }),
        ...(clientBriefUrl !== undefined && { clientBriefUrl }),
        ...(campaignDocsUrl !== undefined && { campaignDocsUrl }),
      },
    });

    // Update team member assignments if provided
    if (Array.isArray(teamMembers)) {
      await prisma.clientAssignment.deleteMany({
        where: { clientId: params.id },
      });

      if (teamMembers.length > 0) {
        await prisma.clientAssignment.createMany({
          data: teamMembers.map((m: { userId: string; role: string }) => ({
            clientId: params.id,
            userId: m.userId,
            role: m.role || "MEMBER",
          })),
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CLIENT_UPDATED",
        entityType: "CLIENT",
        entityId: updatedClient.id,
        details: `Updated client details for ${updatedClient.brandName}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json(
      { error: "Failed to update client details" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client (Admin only)
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

    const client = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CLIENT_DELETED",
        entityType: "CLIENT",
        details: `Removed client profile for ${client.brandName}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, message: "Client deleted" });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json(
      { error: "Failed to delete client profile" },
      { status: 500 }
    );
  }
}
