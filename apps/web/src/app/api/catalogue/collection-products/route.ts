import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches products for a specific Home Depot design collection via SerpAPI.
 * Uses the `home_depot` engine which searches HD's actual product catalogue.
 * Only called when a user clicks into a collection – NOT on initial page load.
 *
 * Query params:
 *   q  – Search query (from HDCollection.serpQuery)
 */

interface HDProduct {
  position: number;
  product_id: string;
  title: string;
  thumbnails: string[][][];
  link: string;
  model_number?: string;
  brand?: string;
  rating?: number;
  reviews?: number;
  price?: number;
  unit?: string;
  badge?: { text: string };
  delivery?: { free?: boolean };
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
    // Use SerpAPI's Home Depot engine to search HD's actual catalogue
    const params = new URLSearchParams({
      engine: "home_depot",
      q: query,
      api_key: serpApiKey,
      ps: "24", // page size
    });

    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);

    if (!res.ok) {
      return NextResponse.json({
        products: [],
        source: "error",
        error: `SerpAPI returned ${res.status}`,
      });
    }

    const data = await res.json();
    const results: HDProduct[] = data.products || [];

    const products = results.slice(0, 18).map((r) => {
      // HD thumbnails come in nested arrays with different resolutions.
      // Pick the 400px or 600px version for good quality.
      const thumbArr = r.thumbnails?.[0] || [];
      // thumbArr is array of URLs at different sizes: 65, 100, 145, 300, 400, 600, 1000
      const image = thumbArr[4] || thumbArr[3] || thumbArr[2] || thumbArr[0] || "";

      return {
        id: r.product_id || `hd-${r.position}-${Date.now()}`,
        title: r.title,
        price: r.price != null ? `$${r.price.toFixed(2)}` : "",
        extractedPrice: r.price || 0,
        link: r.link
          ? r.link.replace("apionline.homedepot.com", "www.homedepot.com")
          : `https://www.homedepot.com/p/${r.product_id}`,
        image,
        store: "The Home Depot",
        brand: r.brand || "",
        rating: r.rating || null,
        reviews: r.reviews || null,
        badge: r.badge?.text || null,
        freeDelivery: r.delivery?.free || false,
        modelNumber: r.model_number || "",
      };
    });

    cache.set(cacheKey, { products, ts: Date.now() });

    return NextResponse.json({ products, source: "home_depot" });
  } catch (err) {
    console.error("Collection products fetch error:", err);
    return NextResponse.json({ products: [], error: "Failed to fetch products" }, { status: 500 });
  }
}
