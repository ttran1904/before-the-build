/**
 * Catalogue store registry.
 *
 * Defines every "store" the user can browse for bathroom items, grouped into
 * categories (similar to Instacart's storefront grid). Some stores are fully
 * wired up (Home Depot collections + In-house designer Airtable) — others are
 * scaffolded with a "coming soon" view that documents *what* we plan to pull
 * once the integration is built.
 */

export type StoreId =
  | "in_house"
  | "home_depot"
  | "pottery_barn"
  | "west_elm"
  | "rejuvenation"
  | "crate_and_barrel"
  | "cb2"
  | "visual_comfort";

export type StoreStatus = "live" | "coming_soon";

export type StoreCategory =
  | "Curated for you"
  | "Big-box & DIY"
  | "Modern furniture & decor"
  | "Vintage & artisan"
  | "Lighting specialists";

export interface StoreCatalogueScaffold {
  /** Top-level Bath/Bathroom landing page on the retailer's site. */
  bathLandingUrl: string;
  /** Categories we expect to surface for bathroom shoppers. */
  expectedCategories: string[];
  /** Style descriptors shoppers should expect from this brand. */
  styleVibes: string[];
  /** Typical price tier (relative). */
  priceTier: "$" | "$$" | "$$$" | "$$$$";
  /** A short, honest note about what we'll pull (and any known gaps). */
  integrationNote: string;
}

export interface Store {
  id: StoreId;
  name: string;
  /** Short tagline shown under the store card. */
  tagline: string;
  /** Optional logo asset (placed in /public/images/stores/). Falls back to initials. */
  logo?: string;
  /** Background tint for the card (Tailwind-friendly hex). */
  accent: string;
  category: StoreCategory;
  status: StoreStatus;
  /** Only present for stores that aren't fully wired up yet. */
  scaffold?: StoreCatalogueScaffold;
}

export const STORES: Store[] = [
  // ───────────────────────────── Curated ─────────────────────────────
  {
    id: "in_house",
    name: "In-house Designer",
    tagline: "Hand-picked materials from your Build Better designer.",
    accent: "#e8f0e6",
    category: "Curated for you",
    status: "live",
  },

  // ───────────────────────────── Big-box ─────────────────────────────
  {
    id: "home_depot",
    name: "Home Depot",
    tagline: "Browse curated bathroom collections — vanities, tile, fixtures.",
    accent: "#fdecd3",
    category: "Big-box & DIY",
    status: "live",
  },

  // ──────────────────── Modern furniture & decor ─────────────────────
  {
    id: "pottery_barn",
    name: "Pottery Barn",
    tagline: "Transitional, farmhouse, and coastal bath furnishings.",
    accent: "#f1ead9",
    category: "Modern furniture & decor",
    status: "coming_soon",
    scaffold: {
      bathLandingUrl: "https://www.potterybarn.com/shop/bath/",
      expectedCategories: [
        "Vanities & vanity tops",
        "Bath mirrors",
        "Vanity & sconce lighting",
        "Hardware (knobs, pulls, towel bars)",
        "Bath linens & rugs",
        "Storage (medicine cabinets, ladders, shelves)",
        "Bath accessories (trays, soap dispensers)",
      ],
      styleVibes: ["Transitional", "Farmhouse", "Classic", "Coastal"],
      priceTier: "$$$",
      integrationNote:
        "Pottery Barn does not publish a public product API. We'll scrape via SerpAPI's google_shopping or a site-scoped query, the same pattern we use for Home Depot collections.",
    },
  },
  {
    id: "west_elm",
    name: "West Elm",
    tagline: "Modern and mid-century bath pieces with a designer edge.",
    accent: "#e7e3da",
    category: "Modern furniture & decor",
    status: "coming_soon",
    scaffold: {
      bathLandingUrl: "https://www.westelm.com/shop/bath/",
      expectedCategories: [
        "Vanities & sinks",
        "Bath mirrors",
        "Vanity lighting & sconces",
        "Hardware & towel bars",
        "Storage & medicine cabinets",
        "Bath textiles (towels, rugs, shower curtains)",
        "Accessories",
      ],
      styleVibes: ["Modern", "Mid-century", "Contemporary", "Scandi"],
      priceTier: "$$$",
      integrationNote:
        "Same Williams-Sonoma family as Pottery Barn — no public API. Plan: site-scoped SerpAPI search keyed off the bath landing page, then normalize into our shared Product shape.",
    },
  },
  {
    id: "crate_and_barrel",
    name: "Crate & Barrel",
    tagline: "Polished, contemporary bath accents and storage.",
    accent: "#ece7df",
    category: "Modern furniture & decor",
    status: "coming_soon",
    scaffold: {
      bathLandingUrl: "https://www.crateandbarrel.com/bath/1",
      expectedCategories: [
        "Bath mirrors",
        "Bath storage (cabinets, shelves, ladders)",
        "Bath lighting",
        "Hardware & hooks",
        "Bath linens",
        "Accessories (trays, dispensers, wastebaskets)",
      ],
      styleVibes: ["Contemporary", "Transitional", "Modern Classic"],
      priceTier: "$$$",
      integrationNote:
        "Crate & Barrel carries fewer hard-install items (no full vanities). We'll scope to mirrors, lighting, storage, and accessories. SerpAPI google_shopping with site:crateandbarrel.com is the planned source.",
    },
  },
  {
    id: "cb2",
    name: "CB2",
    tagline: "Crate & Barrel's modern, edgier sister — sleek bath accents.",
    accent: "#e4e2dc",
    category: "Modern furniture & decor",
    status: "coming_soon",
    scaffold: {
      bathLandingUrl: "https://www.cb2.com/bath/1",
      expectedCategories: [
        "Bath mirrors",
        "Bath storage & ladders",
        "Vanity & ceiling lighting",
        "Hardware",
        "Bath accessories",
        "Bath linens",
      ],
      styleVibes: ["Modern", "Industrial", "Minimalist", "Contemporary"],
      priceTier: "$$",
      integrationNote:
        "Same parent (Euromarket Designs) and same lack of public API as Crate & Barrel. Reuse the C&B scraping pipeline with site:cb2.com.",
    },
  },

  // ─────────────────────── Vintage & artisan ────────────────────────
  {
    id: "rejuvenation",
    name: "Rejuvenation",
    tagline: "Vintage-inspired lighting, hardware, and plumbing fixtures.",
    accent: "#ead9c7",
    category: "Vintage & artisan",
    status: "coming_soon",
    scaffold: {
      bathLandingUrl: "https://www.rejuvenation.com/shop/bath/",
      expectedCategories: [
        "Bathroom lighting (sconces, vanity lights, ceiling)",
        "Faucets (sink & tub)",
        "Showerheads & shower systems",
        "Bath hardware (towel bars, hooks, robe hooks)",
        "Cabinet hardware (knobs, pulls)",
        "Mirrors & medicine cabinets",
        "Bath accessories",
      ],
      styleVibes: ["Vintage", "Classic", "Craftsman", "Mid-century", "Industrial"],
      priceTier: "$$$",
      integrationNote:
        "Rejuvenation is the go-to for period-correct hardware and plumbing. Williams-Sonoma family again — plan to use SerpAPI google_shopping with site:rejuvenation.com plus a curated set of hero collections (e.g. their named collections like Hillside, Quincy, Powell).",
    },
  },

  // ────────────────────── Lighting specialists ──────────────────────
  {
    id: "visual_comfort",
    name: "Visual Comfort & Co.",
    tagline: "Premium decorative lighting from designer collaborations.",
    accent: "#f3ecdc",
    category: "Lighting specialists",
    status: "coming_soon",
    scaffold: {
      bathLandingUrl: "https://www.visualcomfort.com/us/lighting/by-room/bathroom-lighting",
      expectedCategories: [
        "Vanity / bath bar lights",
        "Bath sconces",
        "Bath chandeliers",
        "Bath flush & semi-flush ceiling lights",
        "Bath pendants",
      ],
      styleVibes: ["Designer", "Transitional", "Modern", "Traditional", "Glam"],
      priceTier: "$$$$",
      integrationNote:
        "Premium decorative-only catalog (no vanities, faucets, or tile). Big draw is designer collections — AERIN, Kate Spade NY, Thomas O'Brien, Chapman & Myers, kate spade, etc. Plan to surface a hand-curated list of designer collections first, then drill into products via SerpAPI google_shopping with site:visualcomfort.com.",
    },
  },
];

export const STORE_CATEGORY_ORDER: StoreCategory[] = [
  "Curated for you",
  "Big-box & DIY",
  "Modern furniture & decor",
  "Vintage & artisan",
  "Lighting specialists",
];

export function getStore(id: StoreId): Store | undefined {
  return STORES.find((s) => s.id === id);
}

export function groupStoresByCategory(): { category: StoreCategory; stores: Store[] }[] {
  return STORE_CATEGORY_ORDER.map((category) => ({
    category,
    stores: STORES.filter((s) => s.category === category),
  })).filter((g) => g.stores.length > 0);
}
