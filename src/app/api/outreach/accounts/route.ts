import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/outreach/accounts - List configured Zoho outreach accounts
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.outreachAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderName: true,
        senderEmail: true,
        dataCenter: true,
        lastSyncAt: true,
        createdAt: true,
        // We omit sensitive client secret from public response
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST /api/outreach/accounts - Add or update Zoho outreach account (Admin only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Administrator access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      senderName,
      senderEmail,
      refreshToken,
      dataCenter = "in",
      clientId,
      clientSecret,
    } = body;

    if (!senderName || !senderEmail || !refreshToken) {
      return NextResponse.json(
        { error: "Sender name, email, and Zoho refresh token are required." },
        { status: 400 }
      );
    }

    let finalRefreshToken = refreshToken.trim();
    const effectiveClientId = clientId?.trim() || process.env.ZOHO_CLIENT_ID;
    const effectiveClientSecret = clientSecret?.trim() || process.env.ZOHO_CLIENT_SECRET;

    // If a temporary grant code is entered, exchange it automatically for permanent refresh_token
    if (effectiveClientId && effectiveClientSecret) {
      try {
        const exchangeUrl = `https://accounts.zoho.${dataCenter}/oauth/v2/token`;
        const params = new URLSearchParams({
          code: finalRefreshToken,
          client_id: effectiveClientId,
          client_secret: effectiveClientSecret,
          grant_type: "authorization_code",
        });

        const exchangeRes = await fetch(exchangeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        const exchangeData = await exchangeRes.json();
        if (exchangeData.refresh_token) {
          finalRefreshToken = exchangeData.refresh_token;
        }
      } catch (e) {
        // If not a grant code, assume it's already a permanent refresh token
      }
    }

    const account = await prisma.outreachAccount.upsert({
      where: { senderEmail: senderEmail.toLowerCase().trim() },
      update: {
        senderName: senderName.trim(),
        refreshToken: finalRefreshToken,
        dataCenter: dataCenter.trim(),
        ...(clientId && { clientId: clientId.trim() }),
        ...(clientSecret && { clientSecret: clientSecret.trim() }),
      },
      create: {
        senderName: senderName.trim(),
        senderEmail: senderEmail.toLowerCase().trim(),
        refreshToken: finalRefreshToken,
        dataCenter: dataCenter.trim(),
        clientId: clientId?.trim() || null,
        clientSecret: clientSecret?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (error: any) {
    console.error("Save outreach account error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save account" },
      { status: 500 }
    );
  }
}

// DELETE /api/outreach/accounts - Delete account
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    await prisma.outreachAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
