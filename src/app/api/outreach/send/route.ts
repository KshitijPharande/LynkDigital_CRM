import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getZohoTokenForAccount } from "@/lib/zoho";
import { getPrimaryAccountInfo, sendZohoEmail } from "@/lib/zoho-mail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, stage = 1, content } = body;

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

    const emailBody =
      content ||
      (stageNum === 1
        ? lead.followupDraft
        : stageNum === 2
        ? lead.followup2Draft
        : stageNum === 3
        ? lead.breakupDraft
        : lead.demoDraft);

    if (!emailBody || !emailBody.trim()) {
      return NextResponse.json(
        { error: "No email body content to send" },
        { status: 400 }
      );
    }

    // STRICT SAFETY CHECK: Block sending if draft contains unresolved placeholders
    const placeholderMatches = emailBody.match(/\{\{[^{}]+\}\}/g);
    if (placeholderMatches && placeholderMatches.length > 0) {
      const distinctPlaceholders = Array.from(new Set(placeholderMatches)).join(", ");
      return NextResponse.json(
        {
          error: `Blocked Sending: Unresolved placeholder(s) detected [${distinctPlaceholders}]. Please paste the actual mockup link or fill in the placeholders before sending.`,
          unresolvedPlaceholders: placeholderMatches,
        },
        { status: 400 }
      );
    }

    // 1. Get Zoho credentials for lead's sender
    const { accessToken, dataCenter } = await getZohoTokenForAccount(
      lead.senderEmail
    );
    const { accountId, emailAddress } = await getPrimaryAccountInfo(
      accessToken,
      dataCenter
    );

    // 2. Send email via Zoho in the existing thread (Re:)
    const sendResult = await sendZohoEmail({
      toAddress: lead.email,
      subject: lead.originalSubject,
      content: emailBody,
      accessToken,
      dataCenter,
      accountId,
      fromAddress: emailAddress || lead.senderEmail,
      mailId: lead.zohoMessageId.startsWith("manual-") ? undefined : lead.zohoMessageId,
      action: "reply",
    });

    // 3. Update lead status in database
    const now = new Date();
    const updateData: any = {};

    if (stageNum === 1) {
      updateData.status = "followup_1_sent";
      updateData.followupSentDate = now;
      updateData.followupDraft = emailBody;
    } else if (stageNum === 2) {
      updateData.status = "followup_2_sent";
      updateData.followup2SentDate = now;
      updateData.followup2Draft = emailBody;
    } else if (stageNum === 3) {
      updateData.status = "breakup_sent";
      updateData.breakupSentDate = now;
      updateData.breakupDraft = emailBody;
    } else if (stageNum === 4) {
      updateData.status = "demo_sent";
      updateData.demoSentDate = now;
      updateData.demoDraft = emailBody;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: updateData,
    });

    // Log action in Activity Log
    const stageLabel =
      stageNum === 4
        ? "Demo Mockup Email"
        : stageNum === 3
        ? "Break-Up Email"
        : `Follow-up #${stageNum}`;

    await prisma.activityLog.create({
      data: {
        action: stageNum === 4 ? "OUTREACH_DEMO_SENT" : "OUTREACH_FOLLOWUP_SENT",
        entityType: "LEAD",
        entityId: lead.id,
        details: `Sent ${stageLabel} to ${lead.businessName} (${lead.email}) from ${lead.senderEmail}`,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      sendResult,
    });
  } catch (error: any) {
    console.error("Send follow-up error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send email via Zoho" },
      { status: 500 }
    );
  }
}
