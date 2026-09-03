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

  const prompt = `You are ${senderName} from LynkDigital, writing a short, natural, high-converting Follow-Up #${stage} email to a prospect in the same thread (Re:).

READ AND ANALYZE THE EXACT EMAIL PREVIOUSLY SENT:
- Recipient / Business: ${params.businessName}
- Original Subject: ${params.originalSubject}
- Original Email Body:
"""
${params.originalBody}
"""

FOLLOW-UP FRAMEWORK TO EXECUTE:
1. GREETING:
   - "Hi [First Name or Team name]," (e.g. "Hi Rob," or "Hi Gardenia team," or "Hi ${params.businessName},").

2. THE "REASON I ASK" HOOK + SPECIFIC PAIN POINT:
   - Start the next sentence with: "The reason I ask is..."
   - Then immediately articulate the specific observation or pain point from the previous email.
   - Examples based on context:
     * If they only have Facebook/Instagram and no website: "The reason I ask is I noticed you're relying mostly on social media right now, which means local homeowners searching Google for [service] in [location] miss your work."
     * If their site is outdated or missing a quote button: "The reason I ask is I noticed your current site is missing an instant quote button and still has the default WordPress icon, which can let potential leads slip away."
     * If they have great photos: "The reason I ask is we've been helping other [industry] businesses showcase their project photos so higher-budget clients reach out directly."

3. LOW-FRICTION MICRO-ASK (Permission for 2-min walkthrough):
   - Ask permission to send the walkthrough/concept:
     * Stage 1: "Can I send over a quick 2-minute video walkthrough of the site concept I put together showing how you could capture those quotes?"
     * Stage 2: "Just checking in one last time, would you be open to checking out the quick 2-minute video walkthrough I put together for ${params.businessName}?"

4. SIGN-OFF:
Cheers,
${senderName}
LynkDigital

CRITICAL RULES:
- NEVER USE EM-DASHES (—) OR EN-DASHES (–). Use standard commas or periods only.
- 2 to 3 sentences maximum. Keep it punchy, conversational, and low pressure.
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
                "You are an expert human copywriter writing short, highly personalized, high-converting cold email follow-ups. You always start follow-ups with 'The reason I ask is...' and directly reference the specific pain point from the previous email. You never use em-dashes (— or –).",
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
    ? `Hi ${params.businessName},\n\nThe reason I ask is we've been helping similar trade and local businesses capture more direct quote requests on Google, and I'd love to show you how with zero risk.\n\nCan I send over a quick 2-minute video walkthrough of the site concept I put together?\n\nCheers,\n${senderName}\nLynkDigital`
    : `Hi ${params.businessName},\n\nJust checking in one last time, would you be open to checking out the quick 2-minute video walkthrough of the site concept I put together for ${params.businessName}?\n\nCheers,\n${senderName}\nLynkDigital`;
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
