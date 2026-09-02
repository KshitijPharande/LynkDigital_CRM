import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getZohoTokenForAccount } from "@/lib/zoho";
import {
  getPrimaryAccountInfo,
  getFolderIds,
  getSentMessages,
  getMessageContent,
  checkInboxForReplies,
  cleanEmailAddress,
  parseBusinessName,
  isOutreachEmail,
} from "@/lib/zoho-mail";
import { generateFollowupDraft, generateBreakupDraft } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const senderEmail = body.senderEmail || currentUser.email;

    // 1. Get Zoho token & account info for this sender
    const { accessToken, dataCenter, senderName } =
      await getZohoTokenForAccount(senderEmail);

    const { accountId } = await getPrimaryAccountInfo(accessToken, dataCenter);
    const { sentFolderId, inboxFolderId } = await getFolderIds(
      accountId,
      accessToken,
      dataCenter
    );

    // 2. Scan Sent Messages (last 50)
    const sentMessages = await getSentMessages(
      accountId,
      sentFolderId,
      accessToken,
      dataCenter,
      50
    );

    let newLeadsCount = 0;

    for (const msg of sentMessages) {
      if (!msg.messageId || !msg.toAddress) continue;

      const cleanedEmail = cleanEmailAddress(msg.toAddress);

      // Deduplication check
      const existing = await prisma.lead.findUnique({
        where: { zohoMessageId: msg.messageId },
      });

      if (existing) {
        if (existing.email !== cleanedEmail) {
          await prisma.lead.update({
            where: { id: existing.id },
            data: { email: cleanedEmail },
          });
        }
        continue;
      }

      // Fetch message body
      const { content } = await getMessageContent(
        accountId,
        sentFolderId,
        msg.messageId,
        accessToken,
        dataCenter
      );

      const subject = msg.subject || "";
      if (isOutreachEmail(subject, content)) {
        const businessName = parseBusinessName(subject, content, cleanedEmail);

        let dateSent = new Date();
        if (msg.sentDateInGMT) {
          const parsed = isNaN(Number(msg.sentDateInGMT))
            ? new Date(msg.sentDateInGMT)
            : new Date(Number(msg.sentDateInGMT));
          if (!isNaN(parsed.getTime())) dateSent = parsed;
        }

        await prisma.lead.create({
          data: {
            businessName,
            email: cleanedEmail,
            originalSubject: subject,
            originalBody: content.slice(0, 3000),
            zohoMessageId: msg.messageId,
            dateSent,
            senderEmail: senderEmail.toLowerCase().trim(),
            senderName,
            status: "pending",
          },
        });
        newLeadsCount++;
      }
    }

    // 3. Scan Inbox for replies
    const activeLeads = await prisma.lead.findMany({
      where: {
        senderEmail: senderEmail.toLowerCase().trim(),
        status: { notIn: ["replied", "closed"] },
      },
    });

    const leadEmails = activeLeads.map((l) => l.email);
    const repliedEmails = await checkInboxForReplies(
      accountId,
      inboxFolderId,
      leadEmails,
      accessToken,
      dataCenter
    );

    let repliedCount = 0;
    for (const email of Array.from(repliedEmails)) {
      await prisma.lead.updateMany({
        where: { email, senderEmail: senderEmail.toLowerCase().trim() },
        data: { status: "replied" },
      });
      repliedCount++;
    }

    // 4. Time-Based Progression (4-Day Rule: Day 4 -> Day 8 -> Day 12)
    const now = new Date();
    const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

    let dueCount = 0;

    const remainingLeads = await prisma.lead.findMany({
      where: {
        senderEmail: senderEmail.toLowerCase().trim(),
        status: { notIn: ["replied", "closed"] },
      },
    });

    for (const lead of remainingLeads) {
      // Stage 1 Follow-up: 4 days after initial email
      if (lead.status === "pending") {
        const elapsed = now.getTime() - new Date(lead.dateSent).getTime();
        if (elapsed >= FOUR_DAYS_MS) {
          // Auto-generate Follow-up 1 draft
          let followupDraft = lead.followupDraft;
          if (!followupDraft) {
            followupDraft = await generateFollowupDraft({
              businessName: lead.businessName,
              originalSubject: lead.originalSubject,
              originalBody: lead.originalBody,
              recipientEmail: lead.email,
              senderName: lead.senderName,
              stage: 1,
            });
          }

          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: "due_for_followup_1",
              followupDraft,
            },
          });
          dueCount++;
        }
      }

      // Stage 2 Follow-up: 4 days after Follow-up 1 sent
      else if (lead.status === "followup_1_sent" && lead.followupSentDate) {
        const elapsed = now.getTime() - new Date(lead.followupSentDate).getTime();
        if (elapsed >= FOUR_DAYS_MS) {
          let followup2Draft = lead.followup2Draft;
          if (!followup2Draft) {
            followup2Draft = await generateFollowupDraft({
              businessName: lead.businessName,
              originalSubject: lead.originalSubject,
              originalBody: lead.originalBody,
              recipientEmail: lead.email,
              senderName: lead.senderName,
              stage: 2,
            });
          }

          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: "due_for_followup_2",
              followup2Draft,
            },
          });
          dueCount++;
        }
      }

      // Final Breakup Email: 4 days after Follow-up 2 sent (Day 12 total)
      else if (lead.status === "followup_2_sent" && lead.followup2SentDate) {
        const elapsed = now.getTime() - new Date(lead.followup2SentDate).getTime();
        if (elapsed >= FOUR_DAYS_MS) {
          let breakupDraft = lead.breakupDraft;
          if (!breakupDraft) {
            breakupDraft = await generateBreakupDraft({
              businessName: lead.businessName,
              originalSubject: lead.originalSubject,
              recipientEmail: lead.email,
              senderName: lead.senderName,
            });
          }

          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: "due_for_breakup",
              breakupDraft,
            },
          });
          dueCount++;
        }
      }
    }

    // Log sync in Activity Log
    await prisma.activityLog.create({
      data: {
        action: "OUTREACH_SYNCED",
        entityType: "LEAD",
        details: `Synced Zoho inbox for ${senderEmail} (${newLeadsCount} new leads, ${repliedCount} replies, ${dueCount} follow-ups due)`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      senderEmail,
      newLeadsCount,
      repliedCount,
      dueCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Zoho sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to sync with Zoho" },
      { status: 500 }
    );
  }
}
