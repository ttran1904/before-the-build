import type { CropBox, IdentifyAndSearchResult } from "../types";
import type { RoomType } from "../prompts";
import { identifyItem } from "./identify";
import { searchProducts } from "./search";

/**
 * Full pipeline: identify an item via Claude Vision, then search for products via SerpAPI.
 * This is the main orchestrator used by the API route.
 */
export async function identifyAndSearch(
  imageUrl: string,
  cropBox: CropBox,
  roomType: RoomType,
  anthropicKey: string,
  serpApiKey: string,
): Promise<IdentifyAndSearchResult> {
  // Step 1: Identify the item
  const identification = await identifyItem(imageUrl, cropBox, roomType, anthropicKey);

  // Step 2: Search for matching products
  const products = await searchProducts(identification.searchTerms, serpApiKey);

  return {
    label: identification.label,
    products,
  };
}
