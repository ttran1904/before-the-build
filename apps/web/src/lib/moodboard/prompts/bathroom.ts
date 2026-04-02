/**
 * Bathroom-specific prompt for identifying items in inspiration photos.
 * Tuned for bathroom fixtures, surfaces, plumbing, decor, and hardware.
 *
 * Used with TWO images:
 *   Image 1 = cropped region the user selected
 *   Image 2 = full room photo for context
 */
export function bathroomIdentifyPrompt(): string {
  return `You are given TWO images.

Image 1 (first image): A cropped close-up of the specific item the user wants to identify and purchase.
Image 2 (second image): The full room photo for context — use this to understand the room style, color scheme, and setting.

Identify the PRIMARY object or material shown in Image 1. Use Image 2 to understand context (e.g. is it a bathroom vanity faucet vs. a kitchen faucet, the overall style, finish, etc.).

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
