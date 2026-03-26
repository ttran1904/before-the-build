import { NextRequest, NextResponse } from "next/server";
import { fetchProductFromLink } from "@/lib/moodboard/engines/fetch-product";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  try {
    const product = await fetchProductFromLink(url, serpApiKey);
    return NextResponse.json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not pull the item from the link. There is an error.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
