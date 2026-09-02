import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/outreach/leads/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

// PATCH /api/outreach/leads/[id] - Update status, notes, or drafts
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      followupDraft,
      followup2Draft,
      breakupDraft,
      notes,
      businessName,
      email,
      region,
    } = body;

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(followupDraft !== undefined && { followupDraft }),
        ...(followup2Draft !== undefined && { followup2Draft }),
        ...(breakupDraft !== undefined && { breakupDraft }),
        ...(notes !== undefined && { notes }),
        ...(businessName && { businessName: businessName.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(region !== undefined && { region: region?.trim() || null }),
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error("Update lead error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/outreach/leads/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.lead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
