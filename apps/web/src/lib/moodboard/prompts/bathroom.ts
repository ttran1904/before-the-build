import type { CropBox } from "../types";

/**
 * Bathroom-specific prompt for identifying items in inspiration photos.
 * Tuned for bathroom fixtures, surfaces, plumbing, decor, and hardware.
 */
export function bathroomIdentifyPrompt(cropBox: CropBox): string {
  return `This is a bathroom/interior design photo. The user has drawn a selection box over a specific area they want to identify and purchase.

The selection covers approximately: left ${Math.round(cropBox.x * 100)}%, top ${Math.round(cropBox.y * 100)}%, width ${Math.round(cropBox.w * 100)}%, height ${Math.round(cropBox.h * 100)}% of the image.

Examine the ENTIRE image for context, then identify the PRIMARY object or material the user is pointing at within that selection box. The edges of the selection may include other objects — focus on what is most central and intentional.

This could be any of these categories:
- Fixtures: faucet, showerhead, shower handle, drain, towel bar, toilet paper holder, doorknob, cabinet handle/pull
- Surfaces/Materials: floor tile, wall tile, countertop, backsplash (include material like marble, porcelain, ceramic, natural stone)
- Furniture: vanity, cabinet, mirror, shelf, storage unit
- Plumbing: bathtub, toilet, sink, shower enclosure, shower door
- Decor: light fixture, plant/planter, artwork, towel, rug, basket
- Hardware: hinges, knobs, drawer pulls

Respond with ONLY the JSON object, nothing else. No explanation, no reasoning, no markdown. Just the raw JSON:
{"label": "concise product name (e.g. matte black wall-mounted rain showerhead)", "searchTerms": "shopping search query to find this product to buy (e.g. matte black rain showerhead bathroom fixture)"}

For the label: include color, material, and style when visible. Keep under 8 words.
For searchTerms: add relevant shopping terms like 'buy', the room type, and product category to improve search accuracy. Keep under 12 words.`;
}
