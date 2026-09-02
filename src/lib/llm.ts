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
      ? `Hi there,\n\nJust following up on my previous note for ${params.businessName}. Still happy to put together a quick preview if you would like to see it. No rush at all, just let me know if it would be helpful.\n\nCheers,\n${senderName}\nLynkDigital`
      : `Hi there,\n\nFollowing up briefly on my earlier note regarding ${params.businessName}'s website. Just wanted to make sure this didn't get buried in your inbox. Let me know if you'd be open to checking out a quick concept.\n\nCheers,\n${senderName}\nLynkDigital`;
  }

  const prompt = `You are ${senderName} from LynkDigital (a web design & development agency).
Write a short (2-3 sentences), natural, casual follow-up email (Follow-up #${stage}) to a prospective business who hasn't replied to your initial cold email.

Original Email You Sent:
- Recipient / Business: ${params.businessName}
- Subject: ${params.originalSubject}
- Original Body:
"""
${params.originalBody.slice(0, 1000)}
"""

CRITICAL HUMAN WRITING RULES:
1. NEVER USE EM-DASHES (—) OR EN-DASHES (–). Use standard commas or periods only.
2. ACCURATE CONTEXT:
   - If you OFFERED to put together a free preview / walkthrough (but hadn't sent it yet), ask if they would still like you to put one together. DO NOT claim you already sent it!
   - If you pointed out a specific website bug or issue in the original email, briefly mention it again naturally.
3. Tone: Casual, friendly, human, zero pressure.
4. Sign-off:
Cheers,
${senderName}
LynkDigital
5. Format: Return ONLY the plain text email body (no markdown backticks, no subject line, no placeholders).`;

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
