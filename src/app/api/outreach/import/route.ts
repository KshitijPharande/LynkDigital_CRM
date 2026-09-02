import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leads, senderEmail, senderName } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "No leads data provided in request" },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of leads) {
      const email = item.email?.toLowerCase()?.trim();
      const businessName = item.businessName?.trim() || item.name?.trim();

      if (!email || !businessName) {
        skippedCount++;
        continue;
      }

      // Avoid duplicates by email or zohoMessageId
      const zohoMessageId =
        item.zohoMessageId ||
        `csv-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      try {
        await prisma.lead.create({
          data: {
            businessName,
            email,
            region: item.region?.trim() || null,
            originalSubject: item.subject?.trim() || "Cold Outreach",
            originalBody: item.body?.trim() || "Imported from CSV spreadsheet",
            zohoMessageId,
            dateSent: item.dateSent ? new Date(item.dateSent) : new Date(),
            senderEmail:
              senderEmail?.toLowerCase().trim() ||
              item.senderEmail?.toLowerCase().trim() ||
              user.email,
            senderName:
              senderName?.trim() || item.senderName?.trim() || user.name,
            status: item.status || "pending",
            notes: item.notes?.trim() || null,
          },
        });
        importedCount++;
      } catch {
        skippedCount++;
      }
    }

    // Log action in Activity Log
    await prisma.activityLog.create({
      data: {
        action: "LEADS_IMPORTED",
        entityType: "LEAD",
        details: `Imported ${importedCount} leads from CSV file (${skippedCount} duplicates/skipped)`,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
    });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to import leads" },
      { status: 500 }
    );
  }
}
