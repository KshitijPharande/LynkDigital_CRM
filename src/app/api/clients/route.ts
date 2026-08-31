import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/clients - List all clients with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { brandName: { contains: search } },
        { industry: { contains: search } },
        { contactPerson: { contains: search } },
        { contactEmail: { contains: search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: [
        { priority: "asc" }, // In sorting, can order by createdAt
        { createdAt: "desc" },
      ],
      include: {
        accountManager: {
          select: { id: true, name: true, email: true, designation: true },
        },
        teamAssignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, designation: true, role: true },
            },
          },
        },
        contentCalendars: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            approvals: true,
            contentCalendars: true,
          },
        },
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Fetch clients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client (Admin only)
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
      brandName,
      industry,
      contactPerson,
      contactEmail,
      contactPhone,
      accountManagerId,
      status = "ACTIVE",
      priority = "MEDIUM",
      services,
      internalNotes,
      googleDriveFolder,
      brandGuidelinesUrl,
      clientBriefUrl,
      campaignDocsUrl,
      teamMembers, // Array of { userId, role }
    } = body;

    if (!brandName || !industry || !contactPerson || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: "Please fill in all required client fields" },
        { status: 400 }
      );
    }

    const newClient = await prisma.client.create({
      data: {
        brandName: brandName.trim(),
        industry: industry.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        accountManagerId: accountManagerId || null,
        status,
        priority,
        services: services?.trim() || "Social Media Marketing",
        internalNotes: internalNotes?.trim() || null,
        googleDriveFolder: googleDriveFolder?.trim() || null,
        brandGuidelinesUrl: brandGuidelinesUrl?.trim() || null,
        clientBriefUrl: clientBriefUrl?.trim() || null,
        campaignDocsUrl: campaignDocsUrl?.trim() || null,
      },
    });

    // Assign team members if provided
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      await prisma.clientAssignment.createMany({
        data: teamMembers.map((m: { userId: string; role: string }) => ({
          clientId: newClient.id,
          userId: m.userId,
          role: m.role || "MEMBER",
        })),
      });
    }

    // Create activity audit log
    await prisma.activityLog.create({
      data: {
        action: "CLIENT_CREATED",
        entityType: "CLIENT",
        entityId: newClient.id,
        details: `Created new client profile for ${newClient.brandName} (${newClient.industry})`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: "Failed to create client profile" },
      { status: 500 }
    );
  }
}
