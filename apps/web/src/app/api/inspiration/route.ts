import { NextRequest, NextResponse } from "next/server";

/*
 * Bathroom inspiration image API
 *
 * Primary: SerpAPI Google Images search (guaranteed bathroom photos)
 * Fallback: Curated Unsplash bathroom-specific photos
 */

// ── Curated fallback set (VERIFIED bathroom interior photos only) ──
const FALLBACK_IMAGES: Record<string, Array<{ id: string; url: string; title: string; tags: string[] }>> = {
  all: [
    { id: "b1", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", title: "Modern White Bathroom", tags: ["modern", "white", "minimal"] },
    { id: "b2", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80", title: "Farmhouse Bathroom", tags: ["farmhouse", "rustic", "wood"] },
    { id: "b3", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80", title: "Minimalist Vanity", tags: ["minimalist", "vanity", "clean"] },
    { id: "b4", url: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&q=80", title: "Contemporary Shower Room", tags: ["modern", "shower", "glass"] },
    { id: "b5", url: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=600&q=80", title: "Spa Bathroom Retreat", tags: ["spa", "luxury", "tub"] },
    { id: "b6", url: "https://images.unsplash.com/photo-1603825491066-983ec2e8ecca?w=600&q=80", title: "Double Vanity Suite", tags: ["luxury", "vanity", "master"] },
    { id: "b7", url: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=80", title: "Bright White Bath", tags: ["modern", "white", "bright"] },
    { id: "b8", url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80", title: "Freestanding Tub Design", tags: ["modern", "tub", "luxury"] },
    { id: "b9", url: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&q=80", title: "Subway Tile Classic", tags: ["traditional", "tiles", "subway"] },
    { id: "b10", url: "https://images.unsplash.com/photo-1600488999585-e4364713b90a?w=600&q=80", title: "Walk-In Shower Design", tags: ["modern", "shower", "tiles"] },
    { id: "b11", url: "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=600&q=80", title: "Art Deco Bathroom", tags: ["art_deco", "gold", "tiles"] },
    { id: "b12", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop&crop=bottom", title: "Plant-Filled Bathroom", tags: ["bohemian", "plants", "natural"] },
    { id: "b13", url: "https://images.unsplash.com/photo-1586798271654-0471bb1b0517?w=600&q=80", title: "Elegant Marble Bath", tags: ["luxury", "marble", "elegant"] },
    { id: "b14", url: "https://images.unsplash.com/photo-1600566752229-250ed79470f8?w=600&q=80", title: "Modern Bathroom Vanity", tags: ["modern", "vanity", "dark"] },
    { id: "b15", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop&crop=top", title: "Boho Mirror Details", tags: ["bohemian", "mirror", "details"] },
    { id: "b16", url: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&q=80&fit=crop&crop=left", title: "Tilework Patterns", tags: ["traditional", "tiles", "pattern"] },
    { id: "b17", url: "https://images.unsplash.com/photo-1584622781867-1c5d8e2bca0d?w=600&q=80", title: "Warm Wood Accents", tags: ["farmhouse", "wood", "warm"] },
    { id: "b18", url: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=600&q=80", title: "Gray Concrete Bath", tags: ["industrial", "concrete", "minimal"] },
    { id: "b19", url: "https://images.unsplash.com/photo-1560185127-bdf0eab46dde?w=600&q=80", title: "Rain Shower Paradise", tags: ["spa", "shower", "rain"] },
    { id: "b20", url: "https://images.unsplash.com/photo-1560185008-a33f5c7b1844?w=600&q=80", title: "Scandinavian Bath", tags: ["scandinavian", "white", "bright"] },
  ],
  modern: [
    { id: "m1", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", title: "Clean Lines Modern Bath", tags: ["modern", "clean", "minimal"] },
    { id: "m2", url: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&q=80", title: "Frameless Glass Shower", tags: ["modern", "glass", "shower"] },
    { id: "m3", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80", title: "Floating Vanity Design", tags: ["modern", "floating", "vanity"] },
    { id: "m4", url: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=80", title: "Matte Black Fixtures", tags: ["modern", "black", "fixtures"] },
    { id: "m5", url: "https://images.unsplash.com/photo-1600488999585-e4364713b90a?w=600&q=80", title: "Large Format Tiles", tags: ["modern", "tiles", "minimal"] },
  ],
  farmhouse: [
    { id: "f1", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80", title: "Shiplap Bathroom", tags: ["farmhouse", "shiplap", "rustic"] },
    { id: "f2", url: "https://images.unsplash.com/photo-1584622781867-1c5d8e2bca0d?w=600&q=80", title: "Reclaimed Wood Vanity", tags: ["farmhouse", "wood", "vanity"] },
    { id: "f3", url: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&q=80", title: "Clawfoot Tub Charm", tags: ["farmhouse", "tub", "vintage"] },
  ],
  coastal: [
    { id: "c1", url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80", title: "Ocean-Inspired Bath", tags: ["coastal", "blue", "relaxed"] },
    { id: "c2", url: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=80", title: "Light & Airy Coastal", tags: ["coastal", "white", "airy"] },
  ],
  spa: [
    { id: "s1", url: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=600&q=80", title: "Luxury Soaking Tub", tags: ["spa", "luxury", "tub"] },
    { id: "s2", url: "https://images.unsplash.com/photo-1560185127-bdf0eab46dde?w=600&q=80", title: "Rain Shower Paradise", tags: ["spa", "shower", "rain"] },
    { id: "s3", url: "https://images.unsplash.com/photo-1603825491066-983ec2e8ecca?w=600&q=80", title: "Heated Floor Retreat", tags: ["spa", "heated", "luxury"] },
  ],
};

// Simple in-memory cache for SerpAPI results to avoid repeat API calls
const imageCache = new Map<string, { images: unknown[]; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const style = searchParams.get("style") || "all";
  const color = searchParams.get("color") || "";
  const size = searchParams.get("size") || "";
  const query = searchParams.get("query") || "";

  // ── 1. Try SerpAPI Google Images (returns real bathroom photos) ──
  const serpApiKey = process.env.SERPAPI_KEY;
  if (serpApiKey) {
    const parts = ["bathroom"];
    if (query) parts.push(query);
    if (style !== "all") parts.push(style);
    if (color) parts.push(color);
    if (size) parts.push(size === "compact" ? "small" : size);
    parts.push("interior design");
    if (!query) parts.push("renovation");
    const searchQuery = parts.join(" ");

    const cacheKey = searchQuery.toLowerCase().trim();
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ images: cached.images, source: "google_images" });
    }

    try {
      const serpUrl = new URL("https://serpapi.com/search.json");
      serpUrl.searchParams.set("engine", "google_images");
      serpUrl.searchParams.set("q", searchQuery);
      serpUrl.searchParams.set("num", "24");
      serpUrl.searchParams.set("safe", "active");
      serpUrl.searchParams.set("api_key", serpApiKey);

      const res = await fetch(serpUrl.toString(), { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        const results = (data.images_results || []) as Array<{
          position: number;
          thumbnail: string;
          original: string;
          title: string;
          source: string;
          link: string;
        }>;

        if (results.length > 0) {
          const images = results
            .filter((r) => r.thumbnail || r.original)
            .map((r, i) => ({
              id: `serp-${style}-${i}`,
              url: r.original || r.thumbnail,
              title: r.title || "Bathroom Design",
              tags: [style !== "all" ? style : "bathroom", "inspiration"],
              source: r.source || "web",
              sourceUrl: r.link || "",
            }));

          if (images.length > 0) {
            imageCache.set(cacheKey, { images, ts: Date.now() });
            return NextResponse.json({ images, source: "google_images" });
          }
        }
      }
    } catch {
      // Fall through to curated images
    }
  }

  // ── 2. Try Pinterest API (if token available) ──
  const pinterestToken = process.env.PINTEREST_ACCESS_TOKEN;
  if (pinterestToken) {
    try {
      const pinterestRes = await fetch(
        `https://api.pinterest.com/v5/search/pins?query=bathroom+renovation+${style !== "all" ? style : ""}&page_size=20`,
        {
          headers: { Authorization: `Bearer ${pinterestToken}` },
          next: { revalidate: 3600 },
        }
      );
      if (pinterestRes.ok) {
        const data = await pinterestRes.json();
        if (data.items?.length) {
          const pinterestImages = data.items
            .map((pin: { id: string; media?: { images?: { "600x"?: { url: string } } }; title?: string; description?: string }, i: number) => ({
              id: `pin-${pin.id || i}`,
              url: pin.media?.images?.["600x"]?.url || "",
              title: pin.title || pin.description || "Pinterest Inspiration",
              tags: ["pinterest", style],
              source: "pinterest",
              sourceUrl: `https://pinterest.com/pin/${pin.id}`,
            }))
            .filter((p: { url: string }) => p.url);
          if (pinterestImages.length > 0) {
            return NextResponse.json({ images: pinterestImages, source: "pinterest" });
          }
        }
      }
    } catch {
      // Fall through to curated images
    }
  }

  // ── 3. Fallback: curated bathroom photos ──
  let images = FALLBACK_IMAGES[style] || FALLBACK_IMAGES.all;

  if (query) {
    const q = query.toLowerCase();
    images = images.filter(
      (img) =>
        img.title.toLowerCase().includes(q) ||
        img.tags.some((t) => t.includes(q))
    );
  }

  return NextResponse.json({ images, source: "curated" });
}
