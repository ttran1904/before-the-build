import { NextRequest, NextResponse } from "next/server";
import {
  HOME_DEPOT_COLLECTIONS,
  type HDCollection,
} from "@/lib/catalogue/home-depot-collections";

/**
 * Fetches products for a Home Depot design collection via SerpAPI.
 *
 * Instead of one generic keyword search (which returns duplicate product types),
 * we search for each major bathroom product CATEGORY using the collection's
 * style keywords.  This yields a diverse, curated-feeling product list that
 * mirrors what the real collection page shows.
 *
 * Query params:
 *   collectionId – ID of the HD collection (e.g. "41010")
 *   q            – (fallback) raw search query
 */

const BATHROOM_CATEGORIES = [
  { label: "vanity", query: "bathroom vanity" },
  { label: "toilet", query: "bathroom toilet" },
  { label: "bathtub", query: "bathtub" },
  { label: "shower", query: "shower door" },
  { label: "faucet", query: "bathroom faucet" },
  { label: "lighting", query: "bathroom light fixture" },
  { label: "mirror", query: "bathroom mirror" },
  { label: "accessories", query: "bathroom accessories" },
];

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

function mapProduct(r: HDProduct) {
  const thumbArr = r.thumbnails?.[0] || [];
  const image =
    thumbArr[4] || thumbArr[3] || thumbArr[2] || thumbArr[0] || "";

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
}

async function searchCategory(
  apiKey: string,
  styleKeywords: string,
  categoryQuery: string,
  limit: number = 3
) {
  const params = new URLSearchParams({
    engine: "home_depot",
    q: `${styleKeywords} ${categoryQuery}`,
    api_key: apiKey,
    ps: String(limit + 2), // slight over-fetch for de-dup
  });

  const res = await fetch(
    `https://serpapi.com/search.json?${params.toString()}`
  );
  if (!res.ok) return [];

  const data = await res.json();
  const results: HDProduct[] = data.products || [];
  return results.slice(0, limit).map(mapProduct);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("collectionId") || "";
  const fallbackQuery = searchParams.get("q") || "";

  if (!collectionId && !fallbackQuery) {
    return NextResponse.json(
      { products: [], error: "Missing collectionId or q parameter" },
      { status: 400 }
    );
  }

  const cacheKey = collectionId || fallbackQuery.toLowerCase().trim();
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
    let collection: HDCollection | undefined;
    if (collectionId) {
      collection = HOME_DEPOT_COLLECTIONS.find((c) => c.id === collectionId);
    }

    let products;
    if (collection) {
      // Multi-category search: one query per product category, batched
      const styleKw = collection.styles.join(" ").toLowerCase();

      const categoryResults = await Promise.all(
        BATHROOM_CATEGORIES.map((cat) =>
          searchCategory(serpApiKey, styleKw, cat.query, 2)
        )
      );

      // Flatten & de-duplicate by product ID
      const seen = new Set<string>();
      products = categoryResults.flat().filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    } else {
      // Fallback: single query (backwards compat)
      const params = new URLSearchParams({
        engine: "home_depot",
        q: fallbackQuery,
        api_key: serpApiKey,
        ps: "24",
      });
      const res = await fetch(
        `https://serpapi.com/search.json?${params.toString()}`
      );
      if (!res.ok) {
        return NextResponse.json({
          products: [],
          source: "error",
          error: `SerpAPI returned ${res.status}`,
        });
      }
      const data = await res.json();
      products = (data.products || []).slice(0, 18).map(mapProduct);
    }

    cache.set(cacheKey, { products, ts: Date.now() });
    return NextResponse.json({ products, source: "home_depot" });
  } catch (err) {
    console.error("Collection products fetch error:", err);
    return NextResponse.json(
      { products: [], error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
