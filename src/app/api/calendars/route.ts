import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/calendars - List all content calendar directories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const where: any = {};

    if (month && month !== "ALL") {
      where.month = month;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (clientId && clientId !== "ALL") {
      where.clientId = clientId;
    }

    const calendars = await prisma.contentCalendar.findMany({
      where,
      orderBy: [{ year: "desc" }, { nextDeadline: "asc" }],
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

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error("Fetch calendars error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content calendars" },
      { status: 500 }
    );
  }
}

// POST /api/calendars - Link a new calendar month to a client
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      month,
      year = 2026,
      googleSheetUrl,
      status = "NOT_STARTED",
      approvalStatus = "PENDING",
      nextDeadline,
    } = body;

    if (!clientId || !month || !googleSheetUrl) {
      return NextResponse.json(
        { error: "Client, month, and Google Sheet URL are required." },
        { status: 400 }
      );
    }

    const newCalendar = await prisma.contentCalendar.create({
      data: {
        clientId,
        month: month.trim(),
        year: Number(year) || 2026,
        googleSheetUrl: googleSheetUrl.trim(),
        status,
        approvalStatus,
        nextDeadline: nextDeadline ? new Date(nextDeadline) : null,
      },
      include: {
        client: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CALENDAR_CREATED",
        entityType: "CALENDAR",
        entityId: newCalendar.id,
        details: `Linked ${newCalendar.month} ${newCalendar.year} Google Sheet for ${newCalendar.client.brandName}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, calendar: newCalendar }, { status: 201 });
  } catch (error) {
    console.error("Create calendar error:", error);
    return NextResponse.json(
      { error: "Failed to create content calendar" },
      { status: 500 }
    );
  }
}
