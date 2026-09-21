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

    // Filter by sender email (Isolated per user)
    const rawSender = sender && sender.trim() !== "" ? sender.trim() : user.email.toLowerCase().trim();

    if (rawSender !== "ALL") {
      if (rawSender.toLowerCase().includes("kshitij")) {
        where.senderEmail = { contains: "kshitij", mode: "insensitive" };
      } else if (rawSender.toLowerCase().includes("swarada")) {
        where.senderEmail = { contains: "swarada", mode: "insensitive" };
      } else {
        where.senderEmail = { equals: rawSender.toLowerCase().trim(), mode: "insensitive" };
      }
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
      case "pending":
      case "waiting":
        where.status = "pending";
        break;
      case "demo_pending":
        where.status = "demo_pending";
        break;
      case "due_1":
        where.status = {
          in: ["due_for_followup_1", "followup_1_drafted"],
        };
        break;
      case "due_2":
        where.status = {
          in: ["due_for_followup_2", "followup_2_drafted"],
        };
        break;
      case "breakup":
        where.status = {
          in: ["due_for_breakup", "breakup_drafted"],
        };
        break;
      case "replied":
        where.status = {
          in: ["replied", "demo_pending", "demo_sent", "manual_reply_needed"],
        };
        break;
      case "dead":
        where.status = { in: ["dead", "closed"] };
        break;
      case "sent":
        where.status = {
          in: ["followup_1_sent", "followup_2_sent", "breakup_sent", "demo_sent", "pending"],
        };
        break;
      default:
        break;
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [{ dateSent: "desc" }, { createdAt: "desc" }],
    });

    // Counts scoped by sender
    const countWhere: any = {};
    if (rawSender !== "ALL") {
      if (rawSender.toLowerCase().includes("kshitij")) {
        countWhere.senderEmail = { contains: "kshitij", mode: "insensitive" };
      } else if (rawSender.toLowerCase().includes("swarada")) {
        countWhere.senderEmail = { contains: "swarada", mode: "insensitive" };
      } else {
        countWhere.senderEmail = { equals: rawSender.toLowerCase().trim(), mode: "insensitive" };
      }
    }

    // Live counts for each specific pipeline stage
    const [totalCount, pendingCount, demoPendingCount, due1Count, due2Count, breakupCount, repliedCount, deadCount] =
      await Promise.all([
        prisma.lead.count({ where: countWhere }),
        prisma.lead.count({
          where: { ...countWhere, status: "pending" },
        }),
        prisma.lead.count({
          where: { ...countWhere, status: "demo_pending" },
        }),
        prisma.lead.count({
          where: {
            ...countWhere,
            status: { in: ["due_for_followup_1", "followup_1_drafted"] },
          },
        }),
        prisma.lead.count({
          where: {
            ...countWhere,
            status: { in: ["due_for_followup_2", "followup_2_drafted"] },
          },
        }),
        prisma.lead.count({
          where: {
            ...countWhere,
            status: { in: ["due_for_breakup", "breakup_drafted"] },
          },
        }),
        prisma.lead.count({
          where: {
            ...countWhere,
            status: { in: ["replied", "demo_pending", "demo_sent", "manual_reply_needed"] },
          },
        }),
        prisma.lead.count({
          where: { ...countWhere, status: { in: ["dead", "closed"] } },
        }),
      ]);

    // Sequence reply step conversion stats
    const [stepFirstEmail, stepFU1, stepFU2, stepBreakup] = await Promise.all([
      prisma.lead.count({ where: { ...countWhere, repliedAtStep: "first_email" } }),
      prisma.lead.count({ where: { ...countWhere, repliedAtStep: "followup_1" } }),
      prisma.lead.count({ where: { ...countWhere, repliedAtStep: "followup_2" } }),
      prisma.lead.count({ where: { ...countWhere, repliedAtStep: "breakup" } }),
    ]);

    return NextResponse.json({
      leads,
      counts: {
        total: totalCount,
        pending: pendingCount,
        demoPending: demoPendingCount,
        due1: due1Count,
        due2: due2Count,
        breakup: breakupCount,
        replied: repliedCount,
        dead: deadCount,
      },
      stats: {
        firstEmailReplies: stepFirstEmail,
        fu1Replies: stepFU1,
        fu2Replies: stepFU2,
        breakupReplies: stepBreakup,
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
