import { NextRequest, NextResponse } from "next/server";
import { identifyAndSearch } from "@/lib/moodboard";
import type { RoomType } from "@/lib/moodboard";

export async function POST(req: NextRequest) {
  const { imageUrl, cropBox, roomType = "bathroom" } = await req.json();

  console.log("[identify-route] Received request:", {
    imageUrl: imageUrl?.slice(0, 100) + "...",
    cropBox,
    roomType,
  });

  if (!imageUrl || !cropBox) {
    console.error("[identify-route] Missing imageUrl or cropBox");
    return NextResponse.json({ error: "Missing imageUrl or cropBox" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERPAPI_KEY;

  if (!anthropicKey || !serpApiKey) {
    console.error("[identify-route] Missing API keys:", {
      hasAnthropic: !!anthropicKey,
      hasSerpApi: !!serpApiKey,
    });
    return NextResponse.json({ error: "Missing API keys" }, { status: 500 });
  }

  try {
    const result = await identifyAndSearch(
      imageUrl,
      cropBox,
      roomType as RoomType,
      anthropicKey,
      serpApiKey,
    );
    console.log("[identify-route] Success:", { label: result.label, productCount: result.products.length });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[identify-route] FAILED:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { label: "Could not identify this item. Try a tighter selection.", products: [] },
    );
  }
}
