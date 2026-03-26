import type { Product } from "../types";

/**
 * Uses SerpAPI Google Shopping to find products matching a search query.
 * Returns up to `limit` product results.
 */
export async function searchProducts(
  query: string,
  serpApiKey: string,
  limit: number = 4,
): Promise<Product[]> {
  const res = await fetch(
    `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=${limit}`
  );

  if (!res.ok) {
    throw new Error(`SerpAPI error: ${res.status}`);
  }

  const data = await res.json();
  return (data.shopping_results || [])
    .slice(0, limit)
    .map((r: Record<string, unknown>) => ({
      title: (r.title as string) || "",
      price: (r.price as string) || String(r.extracted_price || ""),
      source: (r.source as string) || "",
      url: (r.link as string) || (r.product_link as string) || "",
      thumbnail: (r.thumbnail as string) || "",
    }));
}
