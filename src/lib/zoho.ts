import prisma from "./prisma";

interface TokenCacheItem {
  token: string;
  expiresAt: number;
}

const memoryTokens: Record<string, TokenCacheItem> = {};

/**
 * Retrieves a valid Zoho OAuth access token for a given sender email account.
 * Supports multiple accounts (e.g. Kshitij and Swarada).
 */
export async function getZohoTokenForAccount(senderEmail?: string): Promise<{
  accessToken: string;
  dataCenter: string;
  senderEmail: string;
  senderName: string;
  accountId?: string;
}> {
  const now = Date.now();

  // 1. Fetch account from database
  let account = senderEmail
    ? await prisma.outreachAccount.findUnique({
        where: { senderEmail: senderEmail.toLowerCase().trim() },
      })
    : null;

  if (!account) {
    account = await prisma.outreachAccount.findFirst({
      orderBy: { createdAt: "asc" },
    });
  }

  if (!account) {
    // Fallback to environment variables if no DB account created yet
    const envRefreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const envDataCenter = process.env.ZOHO_DATA_CENTER || "in";
    const envSenderEmail = process.env.ZOHO_SENDER_EMAIL || "kshitij@lynkdigital.co.in";
    const envSenderName = process.env.ZOHO_SENDER_NAME || "Kshitij Pharande";

    if (!envRefreshToken) {
      throw new Error(
        "No Zoho account connected. Please connect your Zoho account in Outreach Settings."
      );
    }

    account = {
      id: "env-fallback",
      senderName: envSenderName,
      senderEmail: envSenderEmail,
      refreshToken: envRefreshToken,
      dataCenter: envDataCenter,
      clientId: null,
      clientSecret: null,
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const cacheKey = account.senderEmail;

  // 2. Check in-memory token cache (2-min buffer)
  if (memoryTokens[cacheKey] && memoryTokens[cacheKey].expiresAt > now + 120 * 1000) {
    return {
      accessToken: memoryTokens[cacheKey].token,
      dataCenter: account.dataCenter || "in",
      senderEmail: account.senderEmail,
      senderName: account.senderName,
    };
  }

  // 3. Request fresh access token from Zoho
  const clientId = account.clientId || process.env.ZOHO_CLIENT_ID;
  const clientSecret = account.clientSecret || process.env.ZOHO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Zoho Client ID or Client Secret is missing. Please configure them in .env or Outreach Settings."
    );
  }

  const tokenUrl = `https://accounts.zoho.${account.dataCenter}/oauth/v2/token`;

  const params = new URLSearchParams({
    refresh_token: account.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();

  if (data.error) {
    const desc = data.error_description || data.error;
    throw new Error(`Zoho authentication error (${account.senderEmail}): ${desc}`);
  }

  const expiresInSeconds = Number(data.expires_in) || 3600;
  const accessToken = data.access_token;

  memoryTokens[cacheKey] = {
    token: accessToken,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return {
    accessToken,
    dataCenter: account.dataCenter || "in",
    senderEmail: account.senderEmail,
    senderName: account.senderName,
  };
}
