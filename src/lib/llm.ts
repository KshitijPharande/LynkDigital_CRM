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
 * Helper to extract person's name, trade/niche, and core pain point from original email body.
 */
function extractEmailContext(businessName: string, subject: string, body: string) {
  const plain = body.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
  
  // 1. Extract greeting name (e.g. "Hi Rob", "Hi Nathan", "Hi Eric", "Hi Gardenia team")
  let name = businessName;
  const greetingMatch = plain.match(/(?:Hi|Hello|Hey)\s+([A-Z][a-zA-Z\s&'-]+?)(?:,|\.|\n|<|\band\b)/i);
  if (greetingMatch && greetingMatch[1] && greetingMatch[1].length < 35) {
    name = greetingMatch[1].trim();
  }

  // 2. Extract trade / niche (landscaping, grounds care, roofing, gardening, tree care, etc.)
  let trade = "trade";
  const tradeKeywords = [
    "landscaping", "landscaper", "grounds care", "lawn care", "gardening",
    "roofing", "tree care", "tree experts", "painting", "plumbing",
    "electrical", "builder", "construction", "property maintenance", "spouting", "guttering"
  ];
  for (const kw of tradeKeywords) {
    if (plain.toLowerCase().includes(kw) || subject.toLowerCase().includes(kw) || businessName.toLowerCase().includes(kw)) {
      trade = kw;
      break;
    }
  }

  // 3. Extract specific pain point / hook
  let reasonHook = `The reason I ask is we've been helping other ${trade} businesses get found on Google and capture direct quote requests, and I'd love to show you how with zero risk.`;

  if (
    plain.toLowerCase().includes("don't currently have a website") ||
    plain.toLowerCase().includes("dont currently have a website") ||
    plain.toLowerCase().includes("no website") ||
    plain.toLowerCase().includes("just your facebook") ||
    plain.toLowerCase().includes("facebook and instagram")
  ) {
    reasonHook = `The reason I ask is I noticed you're relying mostly on social media right now without a dedicated website, so local customers searching Google for ${trade} are missing your work.`;
  } else if (
    plain.toLowerCase().includes("wordpress") ||
    plain.toLowerCase().includes("quote button") ||
    plain.toLowerCase().includes("icon") ||
    plain.toLowerCase().includes("bounce")
  ) {
    reasonHook = `The reason I ask is I noticed your current site is missing an instant quote button and could be converting a lot more mobile visitors into direct inquiries.`;
  } else if (
    plain.toLowerCase().includes("before-and-after") ||
    plain.toLowerCase().includes("photos") ||
    plain.toLowerCase().includes("showcase") ||
    plain.toLowerCase().includes("portfolio")
  ) {
    reasonHook = `The reason I ask is we've been helping other ${trade} specialists showcase their before-and-after project photos cleanly so higher-budget clients reach out directly.`;
  }

  return { name, trade, reasonHook };
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
  const senderName = params.senderName || "Kshitij";
  const stage = params.stage || 1;

  const { name, trade, reasonHook } = extractEmailContext(
    params.businessName,
    params.originalSubject,
    params.originalBody
  );

  const prompt = `You are ${senderName} from LynkDigital, writing a short, natural, high-converting Follow-Up #${stage} email to a prospect in the same thread (Re:).

READ AND ANALYZE THE EXACT EMAIL PREVIOUSLY SENT:
- Recipient / Business: ${params.businessName}
- Contact / Greeting Name: ${name}
- Trade / Niche: ${trade}
- Original Subject: ${params.originalSubject}
- Original Email Body:
"""
${params.originalBody}
"""

FOLLOW-UP FRAMEWORK TO EXECUTE:
1. GREETING:
   - "Hi ${name},"

2. THE "REASON I ASK" HOOK + SPECIFIC PAIN POINT:
   - Start with: "The reason I ask is..."
   - Directly state the specific observation or pain point from the previous email.
   - Example based on this lead's context: "${reasonHook}"

3. LOW-FRICTION MICRO-ASK (Permission for 2-min walkthrough):
   - Stage 1: "Can I send over a quick 2-minute video walkthrough of the site concept I put together showing how you could capture those quotes?"
   - Stage 2: "Just checking in one last time, would you be open to checking out the quick 2-minute video walkthrough I put together for ${params.businessName}?"

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

  // Highly contextual rule-based fallback
  return stage === 1
    ? `Hi ${name},\n\n${reasonHook}\n\nCan I send over a quick 2-minute video walkthrough of the site concept I put together?\n\nCheers,\n${senderName}\nLynkDigital`
    : `Hi ${name},\n\nJust checking in one last time, would you be open to checking out the quick 2-minute video walkthrough of the site concept I put together for ${params.businessName}?\n\nCheers,\n${senderName}\nLynkDigital`;
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
