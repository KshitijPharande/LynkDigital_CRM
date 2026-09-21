export function sanitizeHumanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\u2014/g, ", ") // replace em-dash "—" with comma
    .replace(/\u2013/g, "-")  // replace en-dash "–" with hyphen
    .replace(/ ,/g, ",")
    .replace(/  +/g, " ")
    .trim();
}

/**
 * Helper to extract person's name, town/region, trade/niche, and verified pain points from initial email.
 */
export function extractEmailContext(
  businessName: string,
  subject: string,
  body: string,
  region?: string | null
) {
  const plain = (body || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");

  // 1. Extract contact greeting name
  let name = "";
  const greetingMatch = plain.match(/(?:Hi|Hello|Hey)\s+([A-Z][a-zA-Z\s&'-]+?)(?:,|\.|\n|<|\band\b)/i);
  if (greetingMatch && greetingMatch[1] && greetingMatch[1].length < 30) {
    const raw = greetingMatch[1].trim();
    if (!raw.toLowerCase().includes("there") && !raw.toLowerCase().includes("team")) {
      name = raw;
    }
  }

  // Greeting placeholder fallback: if name is not confirmed, use "there"
  const greeting = name ? `Hi ${name}` : "Hi there";

  // 2. Extract town / region
  let town = region?.trim() || "";
  if (!town) {
    const nzTowns = [
      "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier", "Hastings",
      "Dunedin", "Palmerston North", "Nelson", "Rotorua", "New Plymouth", "Whangarei",
      "Invercargill", "Whanganui", "Gisborne", "Queenstown", "Kapiti", "Hibiscus Coast"
    ];
    for (const t of nzTowns) {
      if (plain.toLowerCase().includes(t.toLowerCase()) || subject.toLowerCase().includes(t.toLowerCase())) {
        town = t;
        break;
      }
    }
  }
  if (!town) town = "your area";

  // 3. Extract trade / service
  let service = "services";
  const tradeKeywords = [
    { key: "landscaping", label: "landscaping" },
    { key: "landscaper", label: "landscaping" },
    { key: "grounds care", label: "grounds maintenance" },
    { key: "lawn care", label: "lawn care" },
    { key: "gardening", label: "gardening" },
    { key: "roofing", label: "roofing" },
    { key: "tree care", label: "tree care" },
    { key: "tree expert", label: "tree services" },
    { key: "painting", label: "painting" },
    { key: "painter", label: "painting" },
    { key: "plumbing", label: "plumbing" },
    { key: "plumber", label: "plumbing" },
    { key: "electrical", label: "electrical" },
    { key: "electrician", label: "electrical" },
    { key: "builder", label: "building and renovations" },
    { key: "construction", label: "construction" },
    { key: "property maintenance", label: "property maintenance" },
    { key: "spouting", label: "spouting and guttering" },
    { key: "gutter", label: "gutter cleaning and repairs" },
    { key: "cleaning", label: "cleaning services" }
  ];
  for (const item of tradeKeywords) {
    if (plain.toLowerCase().includes(item.key) || subject.toLowerCase().includes(item.key) || businessName.toLowerCase().includes(item.key)) {
      service = item.label;
      break;
    }
  }

  // 4. Extract verified pain points & compliments from Email 1
  let verifiedPainPoint = "missing out on local clients looking for your work online";
  let painPointDetail = "relying mostly on social media right now without a dedicated website";

  if (
    plain.toLowerCase().includes("no website") ||
    plain.toLowerCase().includes("don't currently have a website") ||
    plain.toLowerCase().includes("dont currently have a website") ||
    plain.toLowerCase().includes("just your facebook") ||
    plain.toLowerCase().includes("facebook and instagram")
  ) {
    verifiedPainPoint = "relying only on Facebook where potential clients searching Google cannot find you directly";
    painPointDetail = "not having an active website for people searching on Google";
  } else if (
    plain.toLowerCase().includes("quote button") ||
    plain.toLowerCase().includes("instant quote") ||
    plain.toLowerCase().includes("mobile") ||
    plain.toLowerCase().includes("bounce")
  ) {
    verifiedPainPoint = "having no direct quote button so visitors leave without getting in touch";
    painPointDetail = "a site that makes it hard for mobile visitors to request an instant quote";
  } else if (
    plain.toLowerCase().includes("before-and-after") ||
    plain.toLowerCase().includes("photos") ||
    plain.toLowerCase().includes("showcase") ||
    plain.toLowerCase().includes("portfolio")
  ) {
    verifiedPainPoint = "great project photos that are scattered or not showcased cleanly in one spot";
    painPointDetail = "showcasing your before-and-after photos cleanly next to your reviews";
  }

  return { name, greeting, town, service, verifiedPainPoint, painPointDetail };
}

/**
 * Generates Follow-up 1 (Day 3, Google visibility) or Follow-up 2 (Day 5, Trust & proof) using Groq AI.
 */
export async function generateFollowupDraft(params: {
  businessName: string;
  originalSubject: string;
  originalBody: string;
  recipientEmail: string;
  senderName?: string;
  stage?: 1 | 2;
  region?: string | null;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const senderName = params.senderName || "Kshitij";
  const stage = params.stage || 1;

  const { name, greeting, town, service, verifiedPainPoint, painPointDetail } = extractEmailContext(
    params.businessName,
    params.originalSubject,
    params.originalBody,
    params.region
  );

  const model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

  if (stage === 1) {
    // Stage 1 (Day 3) - Google visibility angle
    const prompt = `You are ${senderName} from LynkDigital. You are writing a short Follow-Up #1 email to a prospective trade business in New Zealand (sent 2 days after the first email, on the same email thread Re:).

LEAD DATA (Use ONLY these facts):
- Business Name: ${params.businessName}
- Contact / Greeting: ${greeting}
- Town / Area: ${town}
- Service / Trade: ${service}
- Verified Pain Point from Email 1: ${verifiedPainPoint}
- Original Pitch:
"""
${params.originalBody}
"""

FEW-SHOT TEMPLATE EXAMPLE (Adapt this naturally to the lead; do NOT copy word for word):
"""
${greeting},
Quick follow up on my last email. When someone in ${town} searches for ${service}, businesses with a proper website can show up ahead of ones that only have a Facebook page or an outdated site.
A simple site with your services and project photos could put you in front of those people. Happy to send you a free mockup link if you're curious.
Cheers,
${senderName}
"""

RULES:
- NEVER use em-dashes (— or –). Use normal commas or periods only.
- Never state any fact about the business that isn't in the lead record.
- Use "${greeting}," as the opener.
- Short, warm, low-pressure Kiwi tone.
- Output PLAIN TEXT ONLY (no subject line, no markdown, no quotes).`;

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
                  "You write concise, warm, authentic follow-up emails for a web design studio. You never use em-dashes. You adapt the few-shot template smoothly without making up facts.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.65,
            max_tokens: 250,
          }),
        });

        const data = await res.json();
        if (data.choices?.[0]?.message?.content) {
          const cleaned = sanitizeHumanText(data.choices[0].message.content);
          if (cleaned) return cleaned;
        }
      } catch (err) {
        console.error("Groq FU1 draft error:", err);
      }
    }

    // Fallback template
    return `${greeting},\n\nQuick follow up on my last email. When someone in ${town} searches for ${service}, businesses with a proper website can show up ahead of ones that only have a Facebook page or an outdated site.\n\nA simple site with your services and project photos could put you in front of those people. Happy to send you a free mockup link if you're curious.\n\nCheers,\n${senderName}`;
  }

  // Stage 2 (Day 5) - Trust and proof angle
  const prompt = `You are ${senderName} from LynkDigital. You are writing Follow-Up #2 (sent on day 5, on the same thread Re:).

LEAD DATA:
- Business Name: ${params.businessName}
- Contact / Greeting: ${greeting}
- Town / Area: ${town}
- Service / Trade: ${service}
- Verified Pain Point from Email 1: ${verifiedPainPoint}
- Original Pitch:
"""
${params.originalBody}
"""

FEW-SHOT TEMPLATE EXAMPLE (Adapt this naturally; do NOT copy word for word):
"""
${greeting},
I really liked your recent project work, but right now ${painPointDetail} makes it harder for new customers to see that proof.
On a clean site it would sit in one place next to your reviews and a "get a free quote" button. Want me to send a free mockup link? No pressure either way.
Cheers,
${senderName}
"""

RULES:
- NEVER use em-dashes (— or –).
- Never claim a mockup exists yet or claim unverified facts.
- Use "${greeting}," as the opener.
- Short (2-3 sentences max), warm, relaxed, low pressure.
- Output PLAIN TEXT ONLY (no subject, no markdown).`;

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
                "You write short, respectful follow-up emails focused on social proof and trust. No em-dashes. No fluff.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.65,
          max_tokens: 250,
        }),
      });

      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        const cleaned = sanitizeHumanText(data.choices[0].message.content);
        if (cleaned) return cleaned;
      }
    } catch (err) {
      console.error("Groq FU2 draft error:", err);
    }
  }

  // Fallback template
  return `${greeting},\n\nI really liked your project photos, but right now ${painPointDetail}.\n\nOn a clean site it would sit in one place next to your reviews and a "get a free quote" button. Want me to send a free mockup link? No pressure either way.\n\nCheers,\n${senderName}`;
}

/**
 * Generates Breakup email (Day 7) using Groq AI.
 */
export async function generateBreakupDraft(params: {
  businessName: string;
  originalSubject: string;
  recipientEmail: string;
  senderName?: string;
  originalBody?: string;
  region?: string | null;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const senderName = params.senderName || "Kshitij";
  const { greeting } = extractEmailContext(
    params.businessName,
    params.originalSubject,
    params.originalBody || "",
    params.region
  );

  const fallback = `${greeting},\n\nI'll stop chasing after this one. If a better website ever becomes something you want, just reply here and I'll happily put a mockup together.\n\nWishing you a busy season,\n${senderName}\nLynkDigital`;

  if (!apiKey) return fallback;

  const prompt = `You are ${senderName} from LynkDigital.
Write a polite, warm, final "Breakup" email (Day 7, thread Re:) to ${params.businessName}.

FEW-SHOT TEMPLATE EXAMPLE:
"""
${greeting},
I'll stop chasing after this one. If a better website ever becomes something you want, just reply here and I'll happily put a mockup together.
Wishing you a busy season,
${senderName}
LynkDigital
"""

RULES:
- NO EM-DASHES (— or –).
- Keep it under 3 sentences. Polite takeaway.
- Sign-off:
Wishing you a busy season,
${senderName}
LynkDigital
- Plain text only.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: "You write polite breakup emails with no em-dashes." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 200,
      }),
    });

    const data = await res.json();
    if (data.choices?.[0]?.message?.content) {
      const cleaned = sanitizeHumanText(data.choices[0].message.content);
      if (cleaned) return cleaned;
    }
  } catch (err) {
    console.error("Groq breakup generation error:", err);
  }

  return fallback;
}

/**
 * Generates Demo Email draft (sent ONLY after a positive reply) using Groq AI.
 * Leaves {{MOCKUP_LINK}} as an unfilled placeholder for the user to fill in.
 */
export async function generateDemoDraft(params: {
  businessName: string;
  originalSubject: string;
  originalBody: string;
  recipientEmail: string;
  senderName?: string;
  region?: string | null;
  mockupUrl?: string | null;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const senderName = params.senderName || "Kshitij";
  const { greeting, painPointDetail, verifiedPainPoint } = extractEmailContext(
    params.businessName,
    params.originalSubject,
    params.originalBody,
    params.region
  );

  const mockupPlaceholder = params.mockupUrl && params.mockupUrl.trim() !== ""
    ? params.mockupUrl.trim()
    : "{{MOCKUP_LINK}}";

  const fallback = `${greeting},\n\nThanks for getting back to me. As promised, here's a free mockup of a cleaner version of your site: ${mockupPlaceholder}\n\nIt fixes ${painPointDetail}. Have a look on your phone too, since that's where most of your customers will be searching from.\n\nIf you like it, I can help you get it live. If not, no problem at all.\n\nCheers,\n${senderName}\nLynkDigital`;

  if (!apiKey) return fallback;

  const prompt = `You are ${senderName} from LynkDigital.
The lead has replied positively asking to see a concept/mockup.
Write the Demo delivery email (in the same thread Re:).

LEAD DATA:
- Business: ${params.businessName}
- Opener: ${greeting}
- Verified pain point from initial email: ${verifiedPainPoint} (${painPointDetail})

FEW-SHOT TEMPLATE EXAMPLE (Adapt smoothly; leave {{MOCKUP_LINK}} exactly as shown):
"""
${greeting},
Thanks for getting back to me. As promised, here's a free mockup of a cleaner version of your site: {{MOCKUP_LINK}}
It fixes ${painPointDetail}. Have a look on your phone too, since that's where most of your customers will be searching from.
If you like it, I can help you get it live. If not, no problem at all.
Cheers,
${senderName}
LynkDigital
"""

CRITICAL RULES:
- If the mockup link is not provided yet, keep "{{MOCKUP_LINK}}" explicitly inside the text as a placeholder.
- NO EM-DASHES (— or –).
- Never claim unverified facts.
- Plain text only.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
        messages: [
          {
            role: "system",
            content:
              "You write warm, direct demo delivery emails. You preserve {{MOCKUP_LINK}} placeholder if not provided and use zero em-dashes.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 280,
      }),
    });

    const data = await res.json();
    if (data.choices?.[0]?.message?.content) {
      let text = data.choices[0].message.content;
      // Ensure {{MOCKUP_LINK}} or real URL exists
      if (!params.mockupUrl && !text.includes("{{MOCKUP_LINK}}")) {
        text = text.replace(/(mockup|preview|link):?/i, "$1: {{MOCKUP_LINK}}");
      }
      const cleaned = sanitizeHumanText(text);
      if (cleaned) return cleaned;
    }
  } catch (err) {
    console.error("Groq demo draft generation error:", err);
  }

  return fallback;
}

/**
 * Classifies an incoming prospect reply into "positive", "neutral", or "negative".
 */
export async function classifyReply(params: {
  replyText: string;
  subject?: string;
}): Promise<"positive" | "neutral" | "negative"> {
  const text = `${params.subject || ""} ${params.replyText || ""}`.toLowerCase();

  // Fast negative heuristics
  const negativeKeywords = [
    "not looking", "not interested", "no thanks", "no thank you", "remove us",
    "remove me", "unsubscribe", "don't contact", "do not contact", "not at this stage",
    "not right now", "not at this time", "stop emailing", "wrong person", "spam",
    "take me off", "leave us alone"
  ];
  if (negativeKeywords.some((kw) => text.includes(kw))) {
    return "negative";
  }

  // Fast positive heuristics
  const positiveKeywords = [
    "send it over", "send through", "send the link", "mockup", "keen", "interested",
    "show me", "sounds good", "happy to take a look", "love to see", "go ahead",
    "yes please", "sure thing", "let's see", "lets see", "how much does it cost",
    "what's the cost", "whats the cost", "pricing"
  ];
  if (positiveKeywords.some((kw) => text.includes(kw))) {
    return "positive";
  }

  // Use Groq AI for nuanced classification
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && params.replyText.trim().length > 3) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
          messages: [
            {
              role: "system",
              content:
                'You classify email replies from sales leads into exactly one of three categories: "positive", "neutral", or "negative". Output only one word in lowercase.',
            },
            {
              role: "user",
              content: `Classify this reply:\n"""\n${params.replyText}\n"""\n\nOptions:\n- positive (they want to see the mockup / video / concept, or express interest/pricing)\n- neutral (they asked a question like "who is this?", "where are you based?", or ambiguous inquiry)\n- negative (not interested, unsubscribe, rude, decline)\n\nAnswer with one word:`,
            },
          ],
          temperature: 0.1,
          max_tokens: 10,
        }),
      });

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.toLowerCase().trim();
      if (answer?.includes("positive")) return "positive";
      if (answer?.includes("negative")) return "negative";
      if (answer?.includes("neutral")) return "neutral";
    } catch (err) {
      console.error("Groq reply classification error:", err);
    }
  }

  // If ambiguous / question, default to neutral so human can review
  return "neutral";
}
