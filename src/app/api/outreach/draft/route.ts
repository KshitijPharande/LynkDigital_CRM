import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateFollowupDraft, generateBreakupDraft } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, stage = 1 } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    let draft = "";

    if (stage === 1) {
      draft = await generateFollowupDraft({
        businessName: lead.businessName,
        originalSubject: lead.originalSubject,
        originalBody: lead.originalBody,
        recipientEmail: lead.email,
        senderName: lead.senderName,
        stage: 1,
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          followupDraft: draft,
          status: "followup_1_drafted",
        },
      });
    } else if (stage === 2) {
      draft = await generateFollowupDraft({
        businessName: lead.businessName,
        originalSubject: lead.originalSubject,
        originalBody: lead.originalBody,
        recipientEmail: lead.email,
        senderName: lead.senderName,
        stage: 2,
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          followup2Draft: draft,
          status: "followup_2_drafted",
        },
      });
    } else if (stage === 3) {
      draft = await generateBreakupDraft({
        businessName: lead.businessName,
        originalSubject: lead.originalSubject,
        recipientEmail: lead.email,
        senderName: lead.senderName,
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          breakupDraft: draft,
          status: "breakup_drafted",
        },
      });
    }

    return NextResponse.json({ success: true, draft, stage });
  } catch (error: any) {
    console.error("Generate draft error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate draft" },
      { status: 500 }
    );
  }
}
