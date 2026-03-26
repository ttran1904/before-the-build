#!/usr/bin/env node
/**
 * Download bathroom must-have item images via SerpAPI Google Images.
 * Usage: SERPAPI_KEY=xxx node scripts/download-must-have-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../apps/web/public/images/must-haves");

const SERPAPI_KEY = process.env.SERPAPI_KEY;
if (!SERPAPI_KEY) {
  console.error("Set SERPAPI_KEY env variable");
  process.exit(1);
}

// Items ordered from most commonly needed in bathroom renovations to least
const ITEMS = [
  { slug: "new-tile-floor",          query: "bathroom floor tile renovation" },
  { slug: "new-tile-shower-walls",   query: "bathroom shower wall tile" },
  { slug: "single-vanity",           query: "bathroom single vanity cabinet" },
  { slug: "comfort-height-toilet",   query: "comfort height toilet bathroom" },
  { slug: "exhaust-fan-upgrade",     query: "bathroom exhaust fan ventilation" },
  { slug: "recessed-lighting",       query: "bathroom recessed ceiling lighting" },
  { slug: "walk-in-shower",          query: "walk in shower bathroom frameless" },
  { slug: "bathtub",                 query: "freestanding bathtub modern bathroom" },
  { slug: "double-vanity",           query: "bathroom double vanity two sinks" },
  { slug: "glass-shower-door",       query: "frameless glass shower door bathroom" },
  { slug: "medicine-cabinet",        query: "recessed medicine cabinet bathroom mirror" },
  { slug: "rain-showerhead",         query: "rain showerhead bathroom overhead" },
  { slug: "led-mirror",              query: "LED lighted bathroom mirror" },
  { slug: "dimmer-switches",         query: "bathroom dimmer light switch" },
  { slug: "handheld-showerhead",     query: "handheld shower head bathroom" },
  { slug: "non-slip-flooring",       query: "non slip bathroom floor tile" },
  { slug: "grab-bars",               query: "bathroom grab bars safety" },
  { slug: "heated-floors",           query: "bathroom heated radiant floor" },
  { slug: "built-in-shelving",       query: "bathroom built in shelving niche" },
  { slug: "towel-warmer",            query: "bathroom towel warmer rack" },
  { slug: "bidet-bidet-seat",        query: "bidet toilet seat bathroom" },
  { slug: "under-cabinet-lighting",  query: "bathroom under cabinet vanity lighting" },
];

async function searchImage(query) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("num", "5");
  url.searchParams.set("safe", "active");
  url.searchParams.set("api_key", SERPAPI_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const results = data.images_results || [];
  // Prefer original, fall back to thumbnail
  for (const r of results) {
    const imgUrl = r.original || r.thumbnail;
    if (imgUrl && !imgUrl.includes("x-raw-image")) return imgUrl;
  }
  return null;
}

async function downloadImage(url, filePath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  let ext = ".jpg";
  if (contentType.includes("png")) ext = ".png";
  else if (contentType.includes("webp")) ext = ".webp";
  
  const finalPath = filePath.replace(/\.[^.]+$/, ext);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(finalPath, buf);
  return { finalPath, ext, size: buf.length };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = [];
  
  for (const item of ITEMS) {
    const destBase = path.join(OUT_DIR, `${item.slug}.jpg`);
    
    // Skip if already downloaded
    const existing = [".jpg", ".png", ".webp"].find((ext) =>
      fs.existsSync(destBase.replace(/\.[^.]+$/, ext))
    );
    if (existing) {
      const ext = existing;
      console.log(`  ⏭  ${item.slug} (already exists)`);
      manifest.push({ slug: item.slug, ext });
      continue;
    }

    console.log(`🔍 Searching: ${item.query}`);
    try {
      const imgUrl = await searchImage(item.query);
      if (!imgUrl) {
        console.log(`  ❌ No image found for ${item.slug}`);
        continue;
      }
      console.log(`  ⬇  Downloading...`);
      const { ext, size } = await downloadImage(imgUrl, destBase);
      console.log(`  ✅ ${item.slug}${ext} (${(size / 1024).toFixed(0)} KB)`);
      manifest.push({ slug: item.slug, ext });
      
      // Rate limit: 1 second between searches
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ❌ Error for ${item.slug}: ${err.message}`);
    }
  }

  // Write manifest
  const manifestPath = path.join(OUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Done! ${manifest.length}/${ITEMS.length} images downloaded.`);
  console.log(`📄 Manifest: ${manifestPath}`);
}

main();
