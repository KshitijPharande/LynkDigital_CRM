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
import {
  generateFollowupDraft,
  generateBreakupDraft,
  generateDemoDraft,
  classifyReply,
} from "@/lib/llm";

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
    const { accessToken, dataCenter, senderName: configuredSenderName } =
      await getZohoTokenForAccount(senderEmail);

    const { accountId, emailAddress } = await getPrimaryAccountInfo(accessToken, dataCenter);
    const actualSenderEmail = emailAddress || senderEmail;
    const actualSenderName = configuredSenderName || "Kshitij Pharande";

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
      if (!cleanedEmail || cleanedEmail.includes("lynkdigital.co.in")) continue;

      try {
        // Fast-check: if lead already exists in DB, skip fetching full message body over network
        const existingLead = await prisma.lead.findFirst({
          where: { email: cleanedEmail },
        });

        if (existingLead) {
          continue;
        }

        // Fetch message body only for NEW prospective leads
        const { content } = await getMessageContent(
          accountId,
          sentFolderId,
          msg.messageId,
          accessToken,
          dataCenter
        );

        const subject = msg.subject || "";
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
            originalSubject: subject || "Cold Outreach",
            originalBody: content.slice(0, 3000),
            zohoMessageId: msg.messageId,
            dateSent,
            senderEmail: actualSenderEmail.toLowerCase().trim(),
            senderName: actualSenderName,
            status: "pending",
          },
        });
        newLeadsCount++;
      } catch (err) {
        console.error(`Error processing message ${msg.messageId}:`, err);
      }
    }

    // 3. Scan Inbox for replies across all active prospects
    const activeLeads = await prisma.lead.findMany({
      where: {
        status: {
          notIn: ["demo_pending", "demo_sent", "manual_reply_needed", "replied", "closed", "dead"],
        },
      },
    });

    const leadEmails = activeLeads.map((l) => l.email);
    const repliesMap = await checkInboxForReplies(
      accountId,
      inboxFolderId,
      leadEmails,
      accessToken,
      dataCenter
    );

    let repliedCount = 0;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    for (const lead of activeLeads) {
      const replyInfo = repliesMap.get(lead.email.toLowerCase().trim());
      if (!replyInfo) continue;

      // A. Determine which step of the sequence the reply came from
      let repliedAtStep = "first_email";
      if (lead.breakupSentDate) {
        repliedAtStep = "breakup";
      } else if (lead.followup2SentDate) {
        repliedAtStep = "followup_2";
      } else if (lead.followupSentDate) {
        repliedAtStep = "followup_1";
      }

      // B. Classify the sentiment
      let sentiment: "positive" | "neutral" | "negative" = "neutral";
      if (replyInfo.isDeclined) {
        sentiment = "negative";
      } else {
        sentiment = await classifyReply({
          replyText: replyInfo.snippet || replyInfo.subject || "",
          subject: replyInfo.subject || lead.originalSubject,
        });
      }

      // C. Take action based on classification
      if (sentiment === "positive") {
        // Auto-draft Demo email with {{MOCKUP_LINK}}
        const demoDraft = await generateDemoDraft({
          businessName: lead.businessName,
          originalSubject: lead.originalSubject,
          originalBody: lead.originalBody,
          recipientEmail: lead.email,
          senderName: lead.senderName,
          region: lead.region,
        });

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "demo_pending",
            replySentiment: "positive",
            repliedAtStep,
            demoDraft,
            notes: replyInfo.snippet ? `Positive reply received: "${replyInfo.snippet}"` : undefined,
          },
        });
        positiveCount++;
      } else if (sentiment === "negative") {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "closed",
            replySentiment: "negative",
            repliedAtStep,
            notes: replyInfo.snippet ? `Declined / Opt-out: "${replyInfo.snippet}"` : "Prospect declined or opted out.",
          },
        });
        negativeCount++;
      } else {
        // Neutral or Question -> Flag for manual reply
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "manual_reply_needed",
            replySentiment: "neutral",
            repliedAtStep,
            notes: replyInfo.snippet ? `Question/Inquiry received: "${replyInfo.snippet}"` : "Manual question/inquiry received.",
          },
        });
        neutralCount++;
      }

      repliedCount++;
    }

    // 4. Time-Based Progression (2-Day Rule: Day 1 -> Day 3 -> Day 5 -> Day 7)
    const now = new Date();
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours

    let dueCount = 0;

    const remainingLeads = await prisma.lead.findMany({
      where: {
        status: {
          notIn: ["demo_pending", "demo_sent", "manual_reply_needed", "replied", "closed", "dead"],
        },
      },
    });

    for (const lead of remainingLeads) {
      // Stage 1 Follow-up: 2 days after initial email (Day 3 of sequence)
      if (lead.status === "pending") {
        const elapsed = now.getTime() - new Date(lead.dateSent).getTime();
        if (elapsed >= TWO_DAYS_MS) {
          let followupDraft = lead.followupDraft;
          if (!followupDraft) {
            followupDraft = await generateFollowupDraft({
              businessName: lead.businessName,
              originalSubject: lead.originalSubject,
              originalBody: lead.originalBody,
              recipientEmail: lead.email,
              senderName: lead.senderName,
              region: lead.region,
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

      // Stage 2 Follow-up: 2 days after Follow-up 1 sent (Day 5 of sequence)
      else if (lead.status === "followup_1_sent" && lead.followupSentDate) {
        const elapsed = now.getTime() - new Date(lead.followupSentDate).getTime();
        if (elapsed >= TWO_DAYS_MS) {
          let followup2Draft = lead.followup2Draft;
          if (!followup2Draft) {
            followup2Draft = await generateFollowupDraft({
              businessName: lead.businessName,
              originalSubject: lead.originalSubject,
              originalBody: lead.originalBody,
              recipientEmail: lead.email,
              senderName: lead.senderName,
              region: lead.region,
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

      // Breakup Email: 2 days after Follow-up 2 sent (Day 7 of sequence)
      else if (lead.status === "followup_2_sent" && lead.followup2SentDate) {
        const elapsed = now.getTime() - new Date(lead.followup2SentDate).getTime();
        if (elapsed >= TWO_DAYS_MS) {
          let breakupDraft = lead.breakupDraft;
          if (!breakupDraft) {
            breakupDraft = await generateBreakupDraft({
              businessName: lead.businessName,
              originalSubject: lead.originalSubject,
              recipientEmail: lead.email,
              senderName: lead.senderName,
              originalBody: lead.originalBody,
              region: lead.region,
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

      // Sequence Closed / Dead: 2 days after Break-up email sent without reply
      else if (lead.status === "breakup_sent" && lead.breakupSentDate) {
        const elapsed = now.getTime() - new Date(lead.breakupSentDate).getTime();
        if (elapsed >= TWO_DAYS_MS) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: "closed" },
          });
        }
      }
    }

    // Log sync in Activity Log
    await prisma.activityLog.create({
      data: {
        action: "OUTREACH_SYNCED",
        entityType: "LEAD",
        details: `Synced Zoho inbox for ${senderEmail} (${newLeadsCount} new leads, ${repliedCount} replies [${positiveCount} positive, ${neutralCount} manual review, ${negativeCount} closed], ${dueCount} follow-ups due)`,
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
