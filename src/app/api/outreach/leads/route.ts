import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/outreach/leads - Filter leads by stage, status, and sender
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "all";
    const sender = searchParams.get("sender");
    const search = searchParams.get("search");

    const where: any = {};

    // Filter by sender email
    if (sender && sender !== "ALL") {
      where.senderEmail = sender.toLowerCase().trim();
    }

    // Search by business name or email
    if (search && search.trim()) {
      where.OR = [
        { businessName: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { originalSubject: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    // Tab-based filtering
    switch (tab) {
      case "due":
        where.status = {
          in: ["due_for_followup_1", "due_for_followup_2", "due_for_breakup"],
        };
        break;
      case "drafts":
        where.status = {
          in: [
            "followup_1_drafted",
            "followup_2_drafted",
            "breakup_drafted",
          ],
        };
        break;
      case "sent":
        where.status = {
          in: ["followup_1_sent", "followup_2_sent", "breakup_sent", "pending"],
        };
        break;
      case "replied":
        where.status = "replied";
        break;
      case "closed":
        where.status = "closed";
        break;
      default:
        break;
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [{ dateSent: "desc" }, { createdAt: "desc" }],
    });

    // Also get KPI counts
    const [totalCount, dueCount, draftsCount, repliedCount] =
      await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({
          where: {
            status: {
              in: ["due_for_followup_1", "due_for_followup_2", "due_for_breakup"],
            },
          },
        }),
        prisma.lead.count({
          where: {
            status: {
              in: [
                "followup_1_drafted",
                "followup_2_drafted",
                "breakup_drafted",
              ],
            },
          },
        }),
        prisma.lead.count({
          where: { status: "replied" },
        }),
      ]);

    return NextResponse.json({
      leads,
      counts: {
        total: totalCount,
        due: dueCount,
        drafts: draftsCount,
        replied: repliedCount,
      },
    });
  } catch (error) {
    console.error("Fetch outreach leads error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outreach leads" },
      { status: 500 }
    );
  }
}

// POST /api/outreach/leads - Manually create new lead
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      email,
      region,
      originalSubject,
      originalBody,
      zohoMessageId,
      senderEmail,
      senderName,
    } = body;

    if (!businessName || !email) {
      return NextResponse.json(
        { error: "Business name and email are required" },
        { status: 400 }
      );
    }

    const newLead = await prisma.lead.create({
      data: {
        businessName: businessName.trim(),
        email: email.toLowerCase().trim(),
        region: region?.trim() || null,
        originalSubject: originalSubject?.trim() || "Cold Outreach",
        originalBody: originalBody?.trim() || "",
        zohoMessageId: zohoMessageId || `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        dateSent: new Date(),
        senderEmail: senderEmail?.toLowerCase().trim() || user.email,
        senderName: senderName?.trim() || user.name,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, lead: newLead }, { status: 201 });
  } catch (error: any) {
    console.error("Create outreach lead error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create outreach lead" },
      { status: 500 }
    );
  }
}
