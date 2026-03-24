import { NextRequest, NextResponse } from "next/server";

// Curated bathroom inspiration images as fallback (and primary for demo)
// These are Unsplash direct URLs which are free to use
const BATHROOM_IMAGES: Record<string, Array<{ id: string; url: string; title: string; tags: string[] }>> = {
  all: [
    { id: "b1", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", title: "Modern White Bathroom", tags: ["modern", "white", "minimal"] },
    { id: "b2", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80", title: "Luxury Marble Bath", tags: ["luxury", "marble", "spa"] },
    { id: "b3", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80", title: "Contemporary Shower", tags: ["modern", "shower", "glass"] },
    { id: "b4", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80", title: "Farmhouse Bathroom", tags: ["farmhouse", "rustic", "wood"] },
    { id: "b5", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80", title: "Minimalist Vanity", tags: ["minimalist", "vanity", "clean"] },
    { id: "b6", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80", title: "Spa-Like Retreat", tags: ["spa", "luxury", "tub"] },
    { id: "b7", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80", title: "Coastal Bathroom", tags: ["coastal", "blue", "light"] },
    { id: "b8", url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80", title: "Japandi Style Bath", tags: ["japandi", "natural", "wood"] },
    { id: "b9", url: "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=600&q=80", title: "Art Deco Bathroom", tags: ["art_deco", "gold", "tiles"] },
    { id: "b10", url: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=600&q=80", title: "Industrial Loft Bath", tags: ["industrial", "concrete", "dark"] },
    { id: "b11", url: "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=600&q=80", title: "Bright Scandinavian", tags: ["scandinavian", "white", "bright"] },
    { id: "b12", url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80", title: "Traditional Elegance", tags: ["traditional", "classic", "elegant"] },
    { id: "b13", url: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600&q=80", title: "Modern Freestanding Tub", tags: ["modern", "tub", "luxury"] },
    { id: "b14", url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80", title: "Bohemian Bath", tags: ["bohemian", "colorful", "eclectic"] },
    { id: "b15", url: "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=600&q=80", title: "Walk-In Shower Design", tags: ["modern", "shower", "tiles"] },
    { id: "b16", url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80", title: "Double Vanity Suite", tags: ["luxury", "vanity", "master"] },
    { id: "b17", url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=600&q=80", title: "Small Bath Maximized", tags: ["small", "efficient", "modern"] },
    { id: "b18", url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80", title: "Warm Wood Accents", tags: ["farmhouse", "wood", "warm"] },
    { id: "b19", url: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&q=80", title: "Subway Tile Classic", tags: ["traditional", "tiles", "subway"] },
    { id: "b20", url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&q=80", title: "Glass Enclosed Shower", tags: ["modern", "glass", "shower"] },
  ],
  modern: [
    { id: "m1", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", title: "Clean Lines Modern Bath", tags: ["modern", "clean", "minimal"] },
    { id: "m2", url: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600&q=80", title: "Floating Vanity Design", tags: ["modern", "floating", "vanity"] },
    { id: "m3", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80", title: "Frameless Glass Shower", tags: ["modern", "glass", "shower"] },
    { id: "m4", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80", title: "Matte Black Fixtures", tags: ["modern", "black", "fixtures"] },
    { id: "m5", url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&q=80", title: "Large Format Tiles", tags: ["modern", "tiles", "minimal"] },
  ],
  farmhouse: [
    { id: "f1", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80", title: "Shiplap Bathroom", tags: ["farmhouse", "shiplap", "rustic"] },
    { id: "f2", url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80", title: "Reclaimed Wood Vanity", tags: ["farmhouse", "wood", "vanity"] },
    { id: "f3", url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80", title: "Clawfoot Tub Charm", tags: ["farmhouse", "tub", "vintage"] },
  ],
  coastal: [
    { id: "c1", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80", title: "Ocean-Inspired Bath", tags: ["coastal", "blue", "relaxed"] },
    { id: "c2", url: "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=600&q=80", title: "Light & Airy Coastal", tags: ["coastal", "white", "airy"] },
  ],
  spa: [
    { id: "s1", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80", title: "Luxury Soaking Tub", tags: ["spa", "luxury", "tub"] },
    { id: "s2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80", title: "Rain Shower Paradise", tags: ["spa", "shower", "rain"] },
    { id: "s3", url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80", title: "Heated Floor Retreat", tags: ["spa", "heated", "luxury"] },
  ],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const style = searchParams.get("style") || "all";
  const query = searchParams.get("query") || "";

  let images = BATHROOM_IMAGES[style] || BATHROOM_IMAGES.all;

  // Filter by search query if provided
  if (query) {
    const q = query.toLowerCase();
    images = images.filter(
      (img) =>
        img.title.toLowerCase().includes(q) ||
        img.tags.some((t) => t.includes(q))
    );
  }

  // Try Pinterest API if token available
  const pinterestToken = process.env.PINTEREST_ACCESS_TOKEN;
  if (pinterestToken && style === "all" && !query) {
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
          const pinterestImages = data.items.map((pin: { id: string; media?: { images?: { "600x"?: { url: string } } }; title?: string; description?: string }, i: number) => ({
            id: `pin-${pin.id || i}`,
            url: pin.media?.images?.["600x"]?.url || "",
            title: pin.title || pin.description || "Pinterest Inspiration",
            tags: ["pinterest", style],
            source: "pinterest",
            sourceUrl: `https://pinterest.com/pin/${pin.id}`,
          })).filter((p: { url: string }) => p.url);
          if (pinterestImages.length > 0) {
            return NextResponse.json({ images: pinterestImages, source: "pinterest" });
          }
        }
      }
    } catch {
      // Fall through to curated images
    }
  }

  return NextResponse.json({ images, source: "curated" });
}
