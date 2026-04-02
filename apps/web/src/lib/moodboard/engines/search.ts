import type { Product } from "../types";

/**
 * Uses SerpAPI Google Shopping to find products matching a search query.
 * For each result, fetches additional images and specs via the product detail API.
 * Returns up to `limit` product results with enriched data.
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
  const shoppingResults = (data.shopping_results || []).slice(0, limit);

  // Fetch product details in parallel for additional images + specs
  const products = await Promise.all(
    shoppingResults.map(async (r: Record<string, unknown>) => {
      const base: Product = {
        title: (r.title as string) || "",
        price: (r.price as string) || String(r.extracted_price || ""),
        source: (r.source as string) || "",
        url: (r.link as string) || (r.product_link as string) || "",
        thumbnail: (r.thumbnail as string) || "",
        images: [],
        specs: {},
      };

      // Try to fetch product detail for images + specs
      const productId = r.product_id as string | undefined;
      if (productId) {
        try {
          const detail = await fetchProductDetail(productId, serpApiKey);
          base.images = detail.images;
          base.specs = detail.specs;
        } catch {
          // If detail fetch fails, keep the base product with thumbnail only
        }
      }

      // Ensure thumbnail is in images array
      if (base.thumbnail && !base.images.includes(base.thumbnail)) {
        base.images.unshift(base.thumbnail);
      }

      return base;
    })
  );

  return products;
}

/**
 * Fetches product detail (images + specs) from SerpAPI Google Product API.
 */
async function fetchProductDetail(
  productId: string,
  serpApiKey: string,
): Promise<{ images: string[]; specs: Record<string, string> }> {
  const res = await fetch(
    `https://serpapi.com/search.json?engine=google_product&product_id=${encodeURIComponent(productId)}&api_key=${serpApiKey}`
  );

  if (!res.ok) {
    return { images: [], specs: {} };
  }

  const data = await res.json();

  // Extract images from product media
  const images: string[] = [];
  const media = data.product_results?.media as Array<{ link: string; type?: string }> | undefined;
  if (Array.isArray(media)) {
    for (const m of media) {
      if (m.link && (!m.type || m.type === "image")) {
        images.push(m.link);
      }
    }
  }

  // Extract specs/attributes
  const specs: Record<string, string> = {};
  const highlights = data.product_results?.specifications as Array<{ name: string; value: string }> | undefined;
  if (Array.isArray(highlights)) {
    for (const h of highlights) {
      if (h.name && h.value) specs[h.name] = h.value;
    }
  }
  // Also pull from extensions if available
  const extensions = data.product_results?.extensions as string[] | undefined;
  if (Array.isArray(extensions)) {
    for (const ext of extensions) {
      const colonIdx = ext.indexOf(":");
      if (colonIdx > 0) {
        specs[ext.slice(0, colonIdx).trim()] = ext.slice(colonIdx + 1).trim();
      }
    }
  }

  return { images: images.slice(0, 6), specs };
}
