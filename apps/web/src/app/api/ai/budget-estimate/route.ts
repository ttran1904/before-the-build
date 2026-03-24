import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { goal, scope, mustHaves, niceToHaves, budgetTier, bathroomSize, style } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      summary: generateFallbackSummary(body),
    });
  }

  try {
    const prompt = `You are a bathroom renovation expert. Generate a brief, helpful summary (3-4 sentences) of a renovation plan based on these inputs:

Goal: ${goal}
Scope: ${scope}
Bathroom Size: ${bathroomSize}
Budget Tier: ${budgetTier}
Style: ${style}
Must-Haves: ${mustHaves?.join(", ") || "None specified"}
Nice-to-Haves: ${niceToHaves?.join(", ") || "None specified"}

Include a rough budget estimate range, key recommendations, and an estimated timeline. Be specific and practical. Keep it under 200 words.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ summary: generateFallbackSummary(body) });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || generateFallbackSummary(body);

    return NextResponse.json({ summary: text });
  } catch {
    return NextResponse.json({ summary: generateFallbackSummary(body) });
  }
}

function generateFallbackSummary(data: Record<string, unknown>) {
  const budgetRanges: Record<string, Record<string, string>> = {
    small: { basic: "$5K–$10K", mid: "$10K–$20K", high: "$20K–$40K" },
    medium: { basic: "$10K–$20K", mid: "$20K–$35K", high: "$35K–$60K" },
    large: { basic: "$15K–$30K", mid: "$30K–$50K", high: "$50K–$100K+" },
  };
  const size = (data.bathroomSize as string) || "medium";
  const tier = (data.budgetTier as string) || "mid";
  const range = budgetRanges[size]?.[tier] || "$10K–$35K";

  return `Based on your ${data.scope || "full"} remodel with a ${tier}-range budget, we estimate ${range} (including 10% contingency). For a ${data.style || "modern"} style bathroom, we recommend starting with your must-haves and phasing in nice-to-haves as budget allows. Typical timeline: ${
    data.scope === "cosmetic" ? "1–2 weeks" : data.scope === "full" ? "4–8 weeks" : "2–4 weeks"
  }.`;
}
