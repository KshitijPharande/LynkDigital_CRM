import { getZohoTokenForAccount } from "./zoho";

export interface ZohoFolder {
  folderId: string;
  folderName: string;
  folderType?: string;
}

export interface ZohoMessageSummary {
  messageId: string;
  folderId: string;
  subject: string;
  sender: string;
  toAddress: string;
  sentDateInGMT: string;
  receivedTime?: string;
  summary?: string;
}

export async function getPrimaryAccountInfo(
  accessToken: string,
  dataCenter: string
): Promise<{ accountId: string; emailAddress: string }> {
  const url = `https://mail.zoho.${dataCenter}/api/accounts`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const json = await res.json();
  if (!json.data || !json.data.length) {
    throw new Error(`Failed to fetch Zoho account ID: ${JSON.stringify(json)}`);
  }
  const account = json.data[0];
  const emailAddress =
    account.incomingUserName ||
    account.accountAddress ||
    account.primaryAddress ||
    "";
  return { accountId: account.accountId, emailAddress };
}

export async function getFolderIds(
  accountId: string,
  accessToken: string,
  dataCenter: string
): Promise<{ sentFolderId: string; inboxFolderId: string }> {
  const url = `https://mail.zoho.${dataCenter}/api/accounts/${accountId}/folders`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const json = await res.json();
  if (!json.data || !Array.isArray(json.data)) {
    throw new Error(`Failed to fetch folders: ${JSON.stringify(json)}`);
  }

  const folders: ZohoFolder[] = json.data;

  const sentFolder = folders.find(
    (f) =>
      f.folderName.toLowerCase() === "sent" ||
      f.folderName.toLowerCase() === "sent messages" ||
      f.folderType?.toLowerCase() === "sent"
  );
  const inboxFolder = folders.find(
    (f) =>
      f.folderName.toLowerCase() === "inbox" ||
      f.folderType?.toLowerCase() === "inbox"
  );

  if (!sentFolder) throw new Error("Could not locate Sent folder in Zoho Mail.");
  if (!inboxFolder) throw new Error("Could not locate Inbox folder in Zoho Mail.");

  return {
    sentFolderId: sentFolder.folderId,
    inboxFolderId: inboxFolder.folderId,
  };
}

export async function getSentMessages(
  accountId: string,
  sentFolderId: string,
  accessToken: string,
  dataCenter: string,
  limit: number = 50
): Promise<ZohoMessageSummary[]> {
  const url = `https://mail.zoho.${dataCenter}/api/accounts/${accountId}/messages/view?folderId=${sentFolderId}&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const json = await res.json();
  if (!json.data || !Array.isArray(json.data)) {
    return [];
  }

  return json.data;
}

export async function getMessageContent(
  accountId: string,
  folderId: string,
  messageId: string,
  accessToken: string,
  dataCenter: string
): Promise<{ content: string }> {
  const url = `https://mail.zoho.${dataCenter}/api/accounts/${accountId}/folders/${folderId}/messages/${messageId}/content`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const json = await res.json();
  return { content: json.data?.content || "" };
}

export interface DetectedReply {
  email: string;
  isDeclined: boolean;
  snippet?: string;
}

export async function checkInboxForReplies(
  accountId: string,
  inboxFolderId: string,
  leadEmails: string[],
  accessToken: string,
  dataCenter: string
): Promise<Map<string, DetectedReply>> {
  const replies = new Map<string, DetectedReply>();
  if (!leadEmails.length) return replies;

  const url = `https://mail.zoho.${dataCenter}/api/accounts/${accountId}/messages/view?folderId=${inboxFolderId}&limit=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const json = await res.json();
  if (!json.data || !Array.isArray(json.data)) {
    return replies;
  }

  const messages: ZohoMessageSummary[] = json.data;
  const leadEmailSet = new Set(leadEmails.map((e) => e.toLowerCase().trim()));

  const declineKeywords = [
    "not looking",
    "not interested",
    "no thanks",
    "no thank you",
    "remove us",
    "remove me",
    "unsubscribe",
    "don't contact",
    "do not contact",
    "not at this stage",
    "not right now",
    "not at this time",
  ];

  for (const msg of messages) {
    const sender = cleanEmailAddress(
      (msg as any).fromAddress || msg.sender || ""
    );
    if (sender && leadEmailSet.has(sender)) {
      const text = `${msg.subject || ""} ${(msg as any).summary || ""}`.toLowerCase();
      const isDeclined = declineKeywords.some((kw) => text.includes(kw));

      replies.set(sender, {
        email: sender,
        isDeclined,
        snippet: (msg as any).summary || msg.subject,
      });
    }
  }

  return replies;
}

export async function sendZohoEmail(params: {
  toAddress: string;
  subject: string;
  content: string;
  accessToken: string;
  dataCenter: string;
  accountId: string;
  fromAddress: string;
  mailId?: string; // Original Zoho Message ID for Re: threading
  action?: "reply" | "compose" | "forward";
}) {
  const isReply = Boolean(params.mailId);
  const url = isReply
    ? `https://mail.zoho.${params.dataCenter}/api/accounts/${params.accountId}/messages/${params.mailId}`
    : `https://mail.zoho.${params.dataCenter}/api/accounts/${params.accountId}/messages`;

  const body: any = {
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    subject: params.subject.startsWith("Re:") ? params.subject : `Re: ${params.subject}`,
    content: params.content.replace(/\n/g, "<br>"),
    mailFormat: "html",
  };

  if (isReply) {
    body.action = params.action || "reply";
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.status?.code !== 200 && json.code !== 200 && json.status?.description !== "success") {
    throw new Error(`Failed to send email via Zoho: ${JSON.stringify(json)}`);
  }

  return json;
}

// -------------------------------------------------------------
// Parsing & Cleaning Utilities
// -------------------------------------------------------------

export function cleanEmailAddress(raw: string): string {
  if (!raw) return "";
  const match =
    raw.match(/<([^>]+)>/) ||
    raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1].toLowerCase().trim() : raw.replace(/"/g, "").toLowerCase().trim();
}

export function parseBusinessName(
  subject: string,
  body: string,
  recipientEmail: string
): string {
  const cleanBody = body.replace(/<[^>]*>/g, " ");

  // 1. Check "Hi [Name] / Team [Name]" in body
  const greetingMatch = cleanBody.match(/(?:Hi|Hello|Hey)\s+([A-Z][a-zA-Z0-9\s&'-]{1,25})(?:,|\n|\s-\s|\.)/);
  if (greetingMatch && !greetingMatch[1].toLowerCase().includes("there")) {
    return greetingMatch[1].trim();
  }

  // 2. Check subject patterns (e.g. "Quick question for [Business]" or "Website redesign for [Business]")
  const subjectMatch = subject.match(/(?:for|at|regarding)\s+([A-Z0-9][a-zA-Z0-9\s&'-]{1,30})/i);
  if (subjectMatch) {
    return subjectMatch[1].trim();
  }

  // 3. Fallback to domain name from email
  const domainPart = recipientEmail.split("@")[1]?.split(".")[0];
  if (domainPart) {
    return domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
  }

  return "Prospect";
}

export function isOutreachEmail(subject: string, body: string, toAddress?: string): boolean {
  if (toAddress && toAddress.toLowerCase().includes("lynkdigital.co.in")) {
    return false; // Skip internal team emails
  }
  return true; // All external outgoing emails in this outreach inbox are prospects
}
