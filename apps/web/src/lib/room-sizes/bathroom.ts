/**
 * Bathroom-specific size categories.
 * Separate from other room types so future rooms (kitchen, bedroom, etc.)
 * can define their own size configs without conflict.
 */

export type BathroomSize = "half-bath" | "three-quarter" | "full-bath" | "primary";

export const BATHROOM_SIZES: {
  id: BathroomSize;
  label: string;
  desc: string;
  sqft: string;
}[] = [
  { id: "half-bath", label: "Half Bath", desc: "Sink + Toilet", sqft: "15–30 sqft" },
  { id: "three-quarter", label: "Three-Quarter Bath", desc: "Sink + Toilet + Shower", sqft: "30–50 sqft" },
  { id: "full-bath", label: "Full Bath", desc: "Sink + Toilet + Shower + Tub", sqft: "50–80 sqft" },
  { id: "primary", label: "Master Bath", desc: "Spacious layout + Double vanity", sqft: "80+ sqft" },
];
