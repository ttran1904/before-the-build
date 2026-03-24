import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { style, scope, mustHaves, budgetTier, bathroomSize, angle } = body;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Return placeholder images when no API key
    return NextResponse.json({
      images: getPlaceholderImages(style),
      source: "placeholder",
    });
  }

  const prompt = `Professional interior design photograph of a ${scope || "full"} bathroom remodel. Style: ${style || "modern"}. Features: ${(mustHaves || []).join(", ") || "walk-in shower, floating vanity, large format tiles"}. Budget level: ${budgetTier || "mid-range"}. Room size: ${bathroomSize || "medium"} bathroom. Angle: ${angle || "full room view from doorway"}. Natural lighting, high resolution, award-winning design, editorial photography.`;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        images: getPlaceholderImages(style),
        source: "placeholder",
      });
    }

    const data = await res.json();
    const images = data.data.map((img: { url: string; revised_prompt?: string }, i: number) => ({
      id: `gen-${Date.now()}-${i}`,
      url: img.url,
      prompt: img.revised_prompt || prompt,
      angle: angle || "full room",
    }));

    return NextResponse.json({ images, source: "dall-e-3" });
  } catch {
    return NextResponse.json({
      images: getPlaceholderImages(style),
      source: "placeholder",
    });
  }
}

function getPlaceholderImages(style?: string) {
  // Return high-quality Unsplash bathroom images as placeholders
  const images = [
    { id: "ph-1", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1024&q=80", angle: "Full Room View", prompt: "Modern bathroom full view" },
    { id: "ph-2", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1024&q=80", angle: "Vanity Area", prompt: "Bathroom vanity close-up" },
    { id: "ph-3", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1024&q=80", angle: "Shower Area", prompt: "Bathroom shower area" },
    { id: "ph-4", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1024&q=80", angle: "Detail Shot", prompt: "Bathroom fixtures detail" },
  ];
  return images;
}
