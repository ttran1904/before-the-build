import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { imageUrl, cropBox } = await req.json();

  if (!imageUrl || !cropBox) {
    return NextResponse.json({ error: "Missing imageUrl or cropBox" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERPAPI_KEY;

  // Step 1: Use Claude Vision to identify the item in the bounding box region
  let label = "Unknown item";
  let searchQuery = "";

  if (anthropicKey) {
    try {
      const identifyRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "url", url: imageUrl },
                },
                {
                  type: "text",
                  text: `This is a bathroom/interior design photo. The user has drawn a selection box over a specific area they want to identify and purchase.

The selection covers approximately: left ${Math.round(cropBox.x * 100)}%, top ${Math.round(cropBox.y * 100)}%, width ${Math.round(cropBox.w * 100)}%, height ${Math.round(cropBox.h * 100)}% of the image.

Examine the ENTIRE image for context, then identify the PRIMARY object or material the user is pointing at within that selection box. The edges of the selection may include other objects — focus on what is most central and intentional.

This could be any of these categories:
- Fixtures: faucet, showerhead, shower handle, drain, towel bar, toilet paper holder, doorknob, cabinet handle/pull
- Surfaces/Materials: floor tile, wall tile, countertop, backsplash (include material like marble, porcelain, ceramic, natural stone)
- Furniture: vanity, cabinet, mirror, shelf, storage unit
- Plumbing: bathtub, toilet, sink, shower enclosure, shower door
- Decor: light fixture, plant/planter, artwork, towel, rug, basket
- Hardware: hinges, knobs, drawer pulls

Respond with ONLY the JSON object, nothing else. No explanation, no reasoning, no markdown. Just the raw JSON:
{"label": "concise product name (e.g. matte black wall-mounted rain showerhead)", "searchTerms": "shopping search query to find this product to buy (e.g. matte black rain showerhead bathroom fixture)"}

For the label: include color, material, and style when visible. Keep under 8 words.
For searchTerms: add relevant shopping terms like 'buy', the room type, and product category to improve search accuracy. Keep under 12 words.`,
                },
              ],
            },
          ],
        }),
      });

      if (identifyRes.ok) {
        const identifyData = await identifyRes.json();
        const rawText = identifyData.content?.[0]?.text?.trim() || "";
        // Extract JSON from the response — Claude may wrap it in markdown code blocks or add reasoning
        const jsonMatch = rawText.match(/\{[\s\S]*"label"\s*:\s*"[^"]+[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            label = parsed.label || label;
            searchQuery = parsed.searchTerms || label;
          } catch {
            // JSON-like text but invalid — identification failed
          }
        }
        // If we still have the default label, identification failed — don't proceed
      }
    } catch {
      // Fall through with default label
    }
  }

  // Step 2: Use SerpAPI Google Shopping to find matching products
  let products: { title: string; price: string; source: string; url: string; thumbnail: string }[] = [];

  if (serpApiKey && label !== "Unknown item") {
    try {
      const query = searchQuery || `${label} bathroom`;
      const serpRes = await fetch(
        `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=4`
      );

      if (serpRes.ok) {
        const serpData = await serpRes.json();
        products = (serpData.shopping_results || [])
          .slice(0, 4)
          .map((r: Record<string, unknown>) => ({
            title: (r.title as string) || "",
            price: (r.price as string) || String(r.extracted_price || ""),
            source: (r.source as string) || "",
            url: (r.link as string) || (r.product_link as string) || "",
            thumbnail: (r.thumbnail as string) || "",
          }));
      }
    } catch {
      // Return empty products
    }
  }

  return NextResponse.json({ label, products });
}
