import type { Product } from "../types";
import { searchProducts } from "./search";

/**
 * Extracts a human-readable product search query from a URL.
 * Handles common retailer URL patterns (Home Depot, Amazon, Wayfair, Lowes, etc.)
 * by parsing the product name from the URL path segments.
 */
function extractSearchQueryFromUrl(url: string): string {
  const parsed = new URL(url);
  const path = decodeURIComponent(parsed.pathname);

  // Remove trailing product IDs (numeric segments at the end)
  const segments = path.split("/").filter(Boolean);

  // Find the segment most likely to be the product name
  // It's usually the longest hyphenated segment, or the last non-numeric one
  let bestSegment = "";
  for (const seg of segments) {
    // Skip short segments, pure numbers, and common path prefixes
    if (/^\d+$/.test(seg)) continue;
    if (["p", "dp", "ip", "product", "products", "item", "s", "catalog", "shop"].includes(seg.toLowerCase())) continue;
    if (seg.length > bestSegment.length) {
      bestSegment = seg;
    }
  }

  if (!bestSegment) {
    // Fallback: use the hostname + full path
    return `${parsed.hostname.replace("www.", "")} ${segments.join(" ")}`;
  }

  // Convert URL slug to search query
  return bestSegment
    .replace(/[-_]/g, " ")       // Convert hyphens/underscores to spaces
    .replace(/\b[A-Z0-9]{6,}\b/g, "")  // Remove long alphanumeric IDs
    .replace(/\s{2,}/g, " ")     // Collapse multiple spaces
    .trim();
}

/**
 * Fetches product info for a given URL by:
 * 1. Extracting a search query from the URL
 * 2. Using SerpAPI Google Shopping to find the matching product
 * 
 * This is more reliable than direct HTML scraping since many retailers
 * block server-side requests (403, captchas, etc.)
 */
export async function fetchProductFromLink(
  url: string,
  serpApiKey: string,
): Promise<Product> {
  // Validate URL
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Invalid URL protocol");
  }

  const query = extractSearchQueryFromUrl(url);
  if (!query || query.length < 3) {
    throw new Error("Could not extract a product name from this URL.");
  }

  // Search for the product via SerpAPI
  const results = await searchProducts(query, serpApiKey, 4);

  if (results.length === 0) {
    throw new Error("Could not find this product. Try a different link or search term.");
  }

  // Try to find a result from the same retailer
  const hostname = parsed.hostname.replace("www.", "").toLowerCase();
  const sameSourceResult = results.find(
    (r) => r.source.toLowerCase().includes(hostname.split(".")[0]) ||
           hostname.includes(r.source.toLowerCase().split(" ")[0])
  );

  // Prefer same-source match, otherwise return best result
  return sameSourceResult || results[0];
}
