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
          max_tokens: 150,
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
                  text: `Look at this interior/bathroom image. Focus specifically on the region at approximately: left ${Math.round(cropBox.x * 100)}%, top ${Math.round(cropBox.y * 100)}%, width ${Math.round(cropBox.w * 100)}%, height ${Math.round(cropBox.h * 100)}% of the image.

What specific product or fixture is in that highlighted region? Respond with ONLY a concise product name including material, color, and style when visible. Examples: "brass wall-mounted faucet", "white marble hexagon floor tile", "frameless glass shower door", "matte black rain showerhead". Keep it under 8 words.`,
                },
              ],
            },
          ],
        }),
      });

      if (identifyRes.ok) {
        const identifyData = await identifyRes.json();
        label = identifyData.content?.[0]?.text?.trim() || label;
      }
    } catch {
      // Fall through with default label
    }
  }

  // Step 2: Use SerpAPI Google Shopping to find matching products
  let products: { title: string; price: string; source: string; url: string; thumbnail: string }[] = [];

  if (serpApiKey && label !== "Unknown item") {
    try {
      const query = `${label} bathroom`;
      const serpRes = await fetch(
        `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=6`
      );

      if (serpRes.ok) {
        const serpData = await serpRes.json();
        products = (serpData.shopping_results || [])
          .slice(0, 6)
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
