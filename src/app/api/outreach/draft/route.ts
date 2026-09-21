import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  generateFollowupDraft,
  generateBreakupDraft,
  generateDemoDraft,
} from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, stage = 1, mockupUrl } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const stageNum = typeof stage === "string" && stage === "demo" ? 4 : Number(stage) || 1;
    let draft = "";

    if (stageNum === 1) {
      draft = await generateFollowupDraft({
        businessName: lead.businessName,
        originalSubject: lead.originalSubject,
        originalBody: lead.originalBody,
        recipientEmail: lead.email,
        senderName: lead.senderName,
        region: lead.region,
        stage: 1,
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          followupDraft: draft,
          status: "followup_1_drafted",
        },
      });
    } else if (stageNum === 2) {
      draft = await generateFollowupDraft({
        businessName: lead.businessName,
        originalSubject: lead.originalSubject,
        originalBody: lead.originalBody,
        recipientEmail: lead.email,
        senderName: lead.senderName,
        region: lead.region,
        stage: 2,
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          followup2Draft: draft,
          status: "followup_2_drafted",
        },
      });
    } else if (stageNum === 3) {
      draft = await generateBreakupDraft({
        businessName: lead.businessName,
        originalSubject: lead.originalSubject,
        recipientEmail: lead.email,
        senderName: lead.senderName,
        originalBody: lead.originalBody,
        region: lead.region,
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          breakupDraft: draft,
          status: "breakup_drafted",
        },
      });
    } else if (stageNum === 4) {
      draft = await generateDemoDraft({
        businessName: lead.businessName,
        originalSubject: lead.originalSubject,
        originalBody: lead.originalBody,
        recipientEmail: lead.email,
        senderName: lead.senderName,
        region: lead.region,
        mockupUrl: mockupUrl || lead.mockupUrl,
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          demoDraft: draft,
          ...(mockupUrl ? { mockupUrl } : {}),
        },
      });
    }

    return NextResponse.json({ success: true, draft, stage: stageNum });
  } catch (error: any) {
    console.error("Generate draft error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate draft" },
      { status: 500 }
    );
  }
}
