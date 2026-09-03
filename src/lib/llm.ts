function sanitizeHumanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\u2014/g, ", ") // replace em-dash "—" with comma
    .replace(/\u2013/g, "-")  // replace en-dash "–" with hyphen
    .replace(/ ,/g, ",")
    .replace(/  +/g, " ")
    .trim();
}

/**
 * Generates natural Follow-up 1 or Follow-up 2 email draft using Groq AI.
 */
export async function generateFollowupDraft(params: {
  businessName: string;
  originalSubject: string;
  originalBody: string;
  recipientEmail: string;
  senderName?: string;
  stage?: 1 | 2;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const senderName = params.senderName || "Kshitij Pharande";
  const stage = params.stage || 1;

  if (!apiKey) {
    // Fallback template if no Groq API key configured
    return stage === 1
      ? `Hi ${params.businessName},\n\nThe reason I ask is we've been helping similar trade and local businesses get found on Google and capture direct quote requests, and want to do the same for ${params.businessName} with zero risk.\n\nCan I send over a quick 2-minute video walkthrough of the site concept I put together?\n\nCheers,\n${senderName}\nLynkDigital`
      : `Hi ${params.businessName},\n\nJust checking in one last time regarding ${params.businessName}. We put together a clean website concept preview with zero obligation, simply to show how to capture more online quote requests.\n\nOpen to checking out the quick 2-minute walkthrough?\n\nCheers,\n${senderName}\nLynkDigital`;
  }

  const prompt = `You are ${senderName} from LynkDigital (a boutique web design & development studio).
Write a short (2-3 sentences max), natural, high-converting follow-up email (Follow-up #${stage}) to a prospective business who hasn't replied to your initial cold email.

Prospect Details:
- Business / Contact Name: ${params.businessName}
- Original Subject: ${params.originalSubject}
- Original Pitch You Sent:
"""
${params.originalBody.slice(0, 1000)}
"""

FOLLOW-UP FRAMEWORK TO USE:
${
  stage === 1
    ? `For Follow-Up #1 (Email 2):
1. Start with: "Hi [First Name or Team],"
2. Hook & Social Proof: "The reason I ask is we've been helping similar trade and local businesses get found on Google and capture direct quote requests, and want to do the same for ${params.businessName} with zero risk."
3. Low-Friction Call-To-Action (Asking permission): "Can I send over a quick 2-minute video walkthrough of the site concept I put together?"
4. Keep it ultra punchy and concise.`
    : `For Follow-Up #2 (Email 3):
1. Start with: "Hi [First Name or Team],"
2. Checking in one last time before wrapping up: Briefly mention you put together the custom site concept for ${params.businessName} to show how much more professional they could look to customers with no obligation.
3. Low-Friction Question: "Would you be open to taking a quick look at the walkthrough?"`
}

CRITICAL RULES:
- NEVER USE EM-DASHES (—) OR EN-DASHES (–). Use standard commas or periods only.
- Do NOT say "did you get the link I sent" because the link hasn't been sent yet.
- Sign-off:
Cheers,
${senderName}
LynkDigital
- Format: Plain text body only (no markdown quotes, no subject line, no placeholders like {first name}).`;

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a real human writing natural, casual, friendly follow-up emails without AI clichés or em-dashes.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || "Groq API error");
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    const cleaned = sanitizeHumanText(text);

    return (
      cleaned ||
      `Hi there,\n\nJust following up on my previous note for ${params.businessName}. Still happy to put together a quick preview if you would like to see it. No rush at all, just let me know if it would be helpful.\n\nCheers,\n${senderName}\nLynkDigital`
    );
  } catch (err: any) {
    console.error("Groq generation error:", err);
    return `Hi there,\n\nJust following up on my previous note for ${params.businessName}. Still happy to put together a quick preview if you would like to see it. No rush at all, just let me know if it would be helpful.\n\nCheers,\n${senderName}\nLynkDigital`;
  }
}

/**
 * Generates a polite, warm "break-up" email draft using Groq AI.
 */
export async function generateBreakupDraft(params: {
  businessName: string;
  originalSubject: string;
  recipientEmail: string;
  senderName?: string;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const senderName = params.senderName || "Kshitij Pharande";

  if (!apiKey) {
    return `Hi there,\n\nI assume you're either super busy right now or completely happy with your current website at ${params.businessName}, so I won't follow up again.\n\nIf you ever want to explore a new concept or upgrade down the road, feel free to reach back out anytime. Wishing you all the best!\n\nCheers,\n${senderName}\nLynkDigital`;
  }

  const prompt = `You are ${senderName} from LynkDigital, a web design studio.
Write a short (2-3 sentences), polite, warm "break-up" follow-up email to a prospective client who didn't reply to previous follow-ups.

Context:
- Business Name: ${params.businessName}
- Original Subject: ${params.originalSubject}

CRITICAL RULES:
- NEVER USE EM-DASHES (—) OR EN-DASHES (–). Use standard commas or periods only.
- Respectful, zero pressure, assumes they are busy or satisfied with their current site.
- Lets them know this is the last follow-up, but welcomes them to reach out anytime in the future if they ever need a redesign.
- Sign-off:
Cheers,
${senderName}
LynkDigital
- Format: plain text only (no subject line, no placeholders, just the email body).`;

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You write polite, warm, low-pressure break-up emails like a real human with no em-dashes.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || "Groq API error");
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    const cleaned = sanitizeHumanText(text);

    return (
      cleaned ||
      `Hi there,\n\nI assume you're either super busy right now or completely happy with your current website at ${params.businessName}, so I won't follow up again.\n\nIf you ever want to explore a new concept or upgrade down the road, feel free to reach back out anytime. Wishing you all the best!\n\nCheers,\n${senderName}\nLynkDigital`
    );
  } catch (err: any) {
    console.error("Groq breakup generation error:", err);
    return `Hi there,\n\nI assume you're either super busy right now or completely happy with your current website at ${params.businessName}, so I won't follow up again.\n\nIf you ever want to explore a new concept or upgrade down the road, feel free to reach back out anytime. Wishing you all the best!\n\nCheers,\n${senderName}\nLynkDigital`;
  }
}
