import type { Product } from "../types";

/**
 * Uses SerpAPI Google Shopping to find products matching a search query.
 * For each result, fetches additional images and specs via the product detail API.
 * Returns up to `limit` product results with enriched data.
 */
export async function searchProducts(
  query: string,
  serpApiKey: string,
  limit: number = 9,
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

      // Pull inline attributes from shopping result (e.g. "Size: 12 x 24 in")
      const extensions = r.extensions as string[] | undefined;
      if (Array.isArray(extensions)) {
        for (const ext of extensions) {
          const colonIdx = ext.indexOf(":");
          if (colonIdx > 0) {
            const key = ext.slice(0, colonIdx).trim();
            const val = ext.slice(colonIdx + 1).trim();
            if (key && val && !base.specs[key]) {
              base.specs[key] = val;
            }
          }
          // Plain extensions without colon — check for dimension-like patterns
          if (colonIdx < 0 && /\d+\s*["″x×X]/.test(ext)) {
            if (!base.specs["Size"]) base.specs["Size"] = ext.trim();
          }
        }
      }

      // Extract dimensions from title as fallback if specs have no size info
      if (!hasDimensionSpec(base.specs)) {
        const titleDim = extractDimensionFromTitle(base.title);
        if (titleDim) {
          base.specs["Size (from title)"] = titleDim;
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

/** Check if specs already contain a dimension-related key */
function hasDimensionSpec(specs: Record<string, string>): boolean {
  const sizeKeys = ["size", "tile size", "dimensions", "product dimensions", "nominal size",
    "actual size", "tile dimensions", "format", "piece size", "length x width"];
  for (const key of Object.keys(specs)) {
    const k = key.toLowerCase().trim();
    if (sizeKeys.some(sk => k.includes(sk))) return true;
  }
  // Also check if any value looks like a dimension
  for (const val of Object.values(specs)) {
    if (/\d+\s*["″]?\s*[x×X]\s*\d+/.test(val) || /\d+\s*(?:in|inch|cm|mm)\s*[x×X]/i.test(val)) return true;
  }
  return false;
}

/** Extract dimension pattern from product title like "12x24", "12 in. x 24 in.", "12" × 24"" */
function extractDimensionFromTitle(title: string): string | null {
  // Match patterns like "12x24", "12 x 24", "12-in. x 24-in.", "12 in x 24 in"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:-?\s*in\.?|")\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(?:-?\s*in\.?|")/i,
    /(\d+(?:\.\d+)?)\s*(?:cm|mm)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(?:cm|mm)/i,
    /\b(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\b/,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) {
      // Check the numbers are plausible tile dimensions (1-48 inches range)
      const a = parseFloat(m[1]);
      const b = parseFloat(m[2]);
      if (a >= 1 && a <= 48 && b >= 1 && b <= 48) {
        return m[0];
      }
    }
  }
  return null;
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
  // Pull from product_results.highlights (freeform text lines)
  const highlightLines = data.product_results?.highlights as string[] | undefined;
  if (Array.isArray(highlightLines)) {
    for (const line of highlightLines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        if (key && val && !specs[key]) specs[key] = val;
      }
    }
  }
  // Pull from product_results.attributes (structured key-value pairs)
  const attributes = data.product_results?.attributes as Record<string, string> | undefined;
  if (attributes && typeof attributes === "object") {
    for (const [k, v] of Object.entries(attributes)) {
      if (k && v && !specs[k]) specs[k] = v;
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
