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
 * Generates contextual, natural Follow-up 1 or Follow-up 2 email draft using Groq AI.
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

  const prompt = `You are ${senderName} from LynkDigital, writing a natural, highly contextual Follow-Up #${stage} email to a prospect who hasn't replied yet.

READ AND ANALYZE THE EXACT EMAIL PREVIOUSLY SENT:
- Recipient / Business: ${params.businessName}
- Original Subject: ${params.originalSubject}
- Original Email Body:
"""
${params.originalBody}
"""

INSTRUCTIONS FOR WRITING THIS FOLLOW-UP:
1. READ THE PREVIOUS EMAIL CAREFULLY. You MUST reflect the exact context, specific offer, pain point, or concept mentioned in the email above (e.g. if you mentioned their Facebook/Instagram presence, their lack of a website, a specific concept preview, trade/niche details, or quote conversion).
2. TONE & STRUCTURE:
   - Casual, conversational, friendly, like a real human following up on a previous message in the same thread.
   - 2 to 3 sentences maximum. Keep it concise and low-friction.
   - Stage 1 (Follow-up #1): Friendly check-in connecting back to what you specifically proposed or noticed in your previous note. Ask if they'd like you to send over the preview/details, with zero pressure.
   - Stage 2 (Follow-up #2): Brief, polite final check-in on the specific idea/concept before assuming it's not a priority right now.
3. CRITICAL RULES:
   - NEVER use cookie-cutter generic templates. Every email must be uniquely tailored to what was actually written in the original email body above.
   - NEVER use em-dashes (—) or en-dashes (–). Use standard commas or periods only.
   - If in the previous email you offered to send a preview/concept/walkthrough, ask if they would like to see it. Do NOT claim you already attached/sent it if you only offered to send it.
   - Sign-off:
Cheers,
${senderName}
LynkDigital
   - Return ONLY the plaintext email body (no subject line, no placeholders, no markdown code blocks).`;

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (apiKey) {
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
                "You are an expert human copywriter writing short, highly personalized, contextual cold email follow-ups. You always carefully read and reference the exact context of the previous email. You never use em-dashes (— or –) and never use generic repetitive boilerplate.",
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
      if (cleaned) return cleaned;
    } catch (err: any) {
      console.error("Groq generation error:", err);
    }
  }

  // Fallback if API unavailable
  return stage === 1
    ? `Hi ${params.businessName},\n\nJust following up on my previous note regarding ${params.originalSubject.replace(/^Re:\s*/i, "")}. Still happy to put together and send over the concept preview if you'd like to take a look?\n\nCheers,\n${senderName}\nLynkDigital`
    : `Hi ${params.businessName},\n\nFollowing up briefly on my earlier note regarding ${params.businessName}. Let me know if you'd be open to checking out the concept preview, no worries at all if it's not a priority right now.\n\nCheers,\n${senderName}\nLynkDigital`;
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
