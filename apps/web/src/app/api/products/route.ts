import { NextRequest, NextResponse } from "next/server";

interface ShoppingResult {
  position: number;
  title: string;
  link: string;
  source: string;
  price: string;
  extracted_price?: number;
  thumbnail: string;
  rating?: number;
  reviews?: number;
}

// Merchant IDs for SerpAPI Google Shopping
const MERCHANT_FILTERS: Record<string, string> = {
  wayfair: "m114978529",
  home_depot: "m7815328441",
  lowes: "m7815328484",
};

const PRODUCT_CATEGORIES = [
  { id: "vanity", label: "Vanity & Sink", queries: ["bathroom vanity", "bathroom sink vanity"] },
  { id: "toilet", label: "Toilet", queries: ["bathroom toilet", "comfort height toilet"] },
  { id: "shower", label: "Shower / Tub", queries: ["walk-in shower kit", "bathroom bathtub", "shower door frameless"] },
  { id: "tile", label: "Tile & Flooring", queries: ["bathroom floor tile", "shower wall tile"] },
  { id: "fixtures", label: "Fixtures", queries: ["bathroom faucet", "rain showerhead", "towel bar set"] },
  { id: "lighting", label: "Lighting", queries: ["bathroom vanity light", "bathroom recessed light"] },
  { id: "mirror", label: "Mirror & Cabinet", queries: ["bathroom mirror LED", "medicine cabinet"] },
  { id: "accessories", label: "Accessories", queries: ["bathroom accessories set", "towel rack", "toilet paper holder"] },
];

const BUDGET_RANGES: Record<string, Record<string, { min: number; max: number }>> = {
  vanity: { basic: { min: 200, max: 500 }, mid: { min: 500, max: 1500 }, high: { min: 1500, max: 5000 } },
  toilet: { basic: { min: 150, max: 300 }, mid: { min: 300, max: 600 }, high: { min: 600, max: 2000 } },
  shower: { basic: { min: 300, max: 800 }, mid: { min: 800, max: 2500 }, high: { min: 2500, max: 8000 } },
  tile: { basic: { min: 30, max: 100 }, mid: { min: 100, max: 300 }, high: { min: 300, max: 800 } },
  fixtures: { basic: { min: 50, max: 150 }, mid: { min: 150, max: 400 }, high: { min: 400, max: 1500 } },
  lighting: { basic: { min: 30, max: 100 }, mid: { min: 100, max: 300 }, high: { min: 300, max: 800 } },
  mirror: { basic: { min: 50, max: 150 }, mid: { min: 150, max: 500 }, high: { min: 500, max: 2000 } },
  accessories: { basic: { min: 20, max: 50 }, mid: { min: 50, max: 150 }, high: { min: 150, max: 500 } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "vanity";
  const budget = searchParams.get("budget") || "mid";
  const style = searchParams.get("style") || "";

  const serpApiKey = process.env.SERPAPI_KEY;

  const catConfig = PRODUCT_CATEGORIES.find((c) => c.id === category);
  const query = catConfig
    ? `${catConfig.queries[0]}${style ? ` ${style}` : ""}`
    : `bathroom ${category}`;

  const range = BUDGET_RANGES[category]?.[budget] || { min: 0, max: 9999 };

  if (!serpApiKey) {
    return NextResponse.json({
      products: getFallbackProducts(category, budget),
      category: catConfig?.label || category,
      source: "fallback",
    });
  }

  try {
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: query,
      api_key: serpApiKey,
      num: "8",
    });

    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({
        products: getFallbackProducts(category, budget),
        category: catConfig?.label || category,
        source: "fallback",
      });
    }

    const data = await res.json();
    const results: ShoppingResult[] = data.shopping_results || [];

    const products = results
      .filter((r) => {
        const price = r.extracted_price || parseFloat(r.price?.replace(/[^0-9.]/g, "") || "0");
        return price >= range.min && price <= range.max;
      })
      .slice(0, 6)
      .map((r) => ({
        id: `serp-${r.position}-${Date.now()}`,
        title: r.title,
        price: r.price,
        extractedPrice: r.extracted_price || parseFloat(r.price?.replace(/[^0-9.]/g, "") || "0"),
        link: r.link,
        source: r.source,
        thumbnail: r.thumbnail,
        rating: r.rating,
        reviews: r.reviews,
        storeLogo: getStoreLogo(r.source),
      }));

    return NextResponse.json({
      products: products.length > 0 ? products : getFallbackProducts(category, budget),
      category: catConfig?.label || category,
      source: products.length > 0 ? "serpapi" : "fallback",
    });
  } catch {
    return NextResponse.json({
      products: getFallbackProducts(category, budget),
      category: catConfig?.label || category,
      source: "fallback",
    });
  }
}

function getStoreLogo(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("wayfair")) return "🏪";
  if (s.includes("home depot")) return "🟧";
  if (s.includes("lowe")) return "🔵";
  if (s.includes("amazon")) return "📦";
  if (s.includes("target")) return "🎯";
  return "🛒";
}

function getFallbackProducts(category: string, budget: string) {
  const fallbacks: Record<string, Array<{ id: string; title: string; price: string; extractedPrice: number; source: string; thumbnail: string; rating: number; reviews: number; link: string; storeLogo: string }>> = {
    vanity: [
      { id: "fv1", title: "Modern 36\" Floating Vanity with Sink", price: "$849.00", extractedPrice: 849, source: "Wayfair", thumbnail: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=200&q=80", rating: 4.5, reviews: 234, link: "#", storeLogo: "🏪" },
      { id: "fv2", title: "Glacier Bay 30\" Bath Vanity", price: "$399.00", extractedPrice: 399, source: "Home Depot", thumbnail: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=200&q=80", rating: 4.3, reviews: 567, link: "#", storeLogo: "🟧" },
      { id: "fv3", title: "Allen + Roth 48\" Double Vanity", price: "$1,299.00", extractedPrice: 1299, source: "Lowe's", thumbnail: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&q=80", rating: 4.7, reviews: 89, link: "#", storeLogo: "🔵" },
    ],
    toilet: [
      { id: "ft1", title: "TOTO Drake II 1.28 GPF", price: "$389.00", extractedPrice: 389, source: "Home Depot", thumbnail: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&q=80", rating: 4.6, reviews: 1205, link: "#", storeLogo: "🟧" },
      { id: "ft2", title: "Kohler Cimarron Comfort Height", price: "$299.00", extractedPrice: 299, source: "Lowe's", thumbnail: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=200&q=80", rating: 4.4, reviews: 890, link: "#", storeLogo: "🔵" },
    ],
    shower: [
      { id: "fs1", title: "DreamLine Enigma-X Frameless Shower Door", price: "$1,049.00", extractedPrice: 1049, source: "Wayfair", thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80", rating: 4.5, reviews: 342, link: "#", storeLogo: "🏪" },
      { id: "fs2", title: "Delta Classic Shower Kit", price: "$499.00", extractedPrice: 499, source: "Home Depot", thumbnail: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=200&q=80", rating: 4.2, reviews: 678, link: "#", storeLogo: "🟧" },
    ],
    tile: [
      { id: "ftl1", title: "Marble Look Porcelain Tile 12x24", price: "$4.29/sqft", extractedPrice: 4.29, source: "Home Depot", thumbnail: "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=200&q=80", rating: 4.4, reviews: 456, link: "#", storeLogo: "🟧" },
      { id: "ftl2", title: "Subway Tile White 3x6 (case of 80)", price: "$39.00", extractedPrice: 39, source: "Lowe's", thumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&q=80", rating: 4.6, reviews: 1023, link: "#", storeLogo: "🔵" },
    ],
    fixtures: [
      { id: "ff1", title: "Moen Align Bathroom Faucet Matte Black", price: "$189.00", extractedPrice: 189, source: "Wayfair", thumbnail: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&q=80", rating: 4.7, reviews: 567, link: "#", storeLogo: "🏪" },
      { id: "ff2", title: "Delta Rain Showerhead 8\"", price: "$129.00", extractedPrice: 129, source: "Home Depot", thumbnail: "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=200&q=80", rating: 4.5, reviews: 890, link: "#", storeLogo: "🟧" },
    ],
    lighting: [
      { id: "fl1", title: "Kichler 3-Light Vanity Light", price: "$129.00", extractedPrice: 129, source: "Wayfair", thumbnail: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=200&q=80", rating: 4.3, reviews: 234, link: "#", storeLogo: "🏪" },
    ],
    mirror: [
      { id: "fm1", title: "LED Bathroom Mirror 36x28 Anti-Fog", price: "$249.00", extractedPrice: 249, source: "Wayfair", thumbnail: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=200&q=80", rating: 4.6, reviews: 456, link: "#", storeLogo: "🏪" },
    ],
    accessories: [
      { id: "fa1", title: "Moen Genta 3-Piece Accessory Set", price: "$79.00", extractedPrice: 79, source: "Home Depot", thumbnail: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=200&q=80", rating: 4.4, reviews: 345, link: "#", storeLogo: "🟧" },
    ],
  };

  return fallbacks[category] || fallbacks.vanity;
}
