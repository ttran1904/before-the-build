import { NextRequest, NextResponse } from "next/server";
import { identifyAndSearch } from "@/lib/moodboard";
import type { RoomType } from "@/lib/moodboard";

export async function POST(req: NextRequest) {
  const { imageUrl, cropBox, roomType = "bathroom" } = await req.json();

  if (!imageUrl || !cropBox) {
    return NextResponse.json({ error: "Missing imageUrl or cropBox" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERPAPI_KEY;

  if (!anthropicKey || !serpApiKey) {
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
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { label: "Could not identify this item. Try a tighter selection.", products: [] },
    );
  }
}
