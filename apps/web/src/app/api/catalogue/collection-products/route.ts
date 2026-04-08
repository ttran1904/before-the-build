import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches products for a specific Home Depot design collection via SerpAPI.
 * Only called when a user clicks into a collection – NOT on initial page load.
 *
 * Query params:
 *   q  – The SerpAPI search query (from HDCollection.serpQuery)
 */

interface ShoppingResult {
  position: number;
  title: string;
  link: string;
  source: string;
  price: string;
  extracted_price?: number;
  thumbnail: string;
  rating?: number;
  reviews?: number;
}

// Cache to avoid repeat SerpAPI calls for the same collection
const cache = new Map<string, { products: unknown[]; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json({ products: [], error: "Missing query parameter" }, { status: 400 });
  }

  const cacheKey = query.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ products: cached.products, source: "cache" });
  }

  const serpApiKey = process.env.SERPAPI_KEY;

  if (!serpApiKey) {
    return NextResponse.json({
      products: [],
      source: "no_api_key",
      error: "SERPAPI_KEY not configured",
    });
  }

  try {
    // Search Google Shopping for bathroom products matching the collection style
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: `${query} bathroom home depot`,
      api_key: serpApiKey,
      num: "12",
      tbs: "mr:1,merchagg:m7815328441", // Home Depot merchant filter
    });

    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);

    let results: ShoppingResult[] = [];

    if (res.ok) {
      const data = await res.json();
      results = data.shopping_results || [];
    }

    // If Home Depot merchant filter returned nothing, broaden the search
    if (results.length === 0) {
      const broadParams = new URLSearchParams({
        engine: "google_shopping",
        q: `${query} bathroom`,
        api_key: serpApiKey,
        num: "12",
      });

      const broadRes = await fetch(`https://serpapi.com/search.json?${broadParams.toString()}`);
      if (broadRes.ok) {
        const data = await broadRes.json();
        results = data.shopping_results || [];
      }
    }

    const products = results.slice(0, 12).map((r) => ({
      id: `col-${r.position}-${Date.now()}`,
      title: r.title,
      price: r.price,
      extractedPrice: r.extracted_price || parseFloat(r.price?.replace(/[^0-9.]/g, "") || "0"),
      link: r.link,
      image: r.thumbnail,
      store: r.source,
      rating: r.rating || null,
      reviews: r.reviews || null,
    }));

    cache.set(cacheKey, { products, ts: Date.now() });

    return NextResponse.json({ products, source: "serpapi" });
  } catch (err) {
    console.error("Collection products fetch error:", err);
    return NextResponse.json({ products: [], error: "Failed to fetch products" }, { status: 500 });
  }
}
