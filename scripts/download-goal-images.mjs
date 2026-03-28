#!/usr/bin/env node
/**
 * Download bathroom renovation goal images via SerpAPI Google Images.
 * Usage: SERPAPI_KEY=xxx node scripts/download-goal-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../apps/web/public/images/goals");

const SERPAPI_KEY = process.env.SERPAPI_KEY;
if (!SERPAPI_KEY) {
  console.error("Set SERPAPI_KEY env variable");
  process.exit(1);
}

// Bathroom renovation goals sorted by popularity
const GOALS = [
  { slug: "update-style",       query: "modern bathroom renovation style update beautiful" },
  { slug: "fix-problems",       query: "bathroom plumbing repair renovation fix leaks mold" },
  { slug: "increase-value",     query: "luxury bathroom renovation increase home value" },
  { slug: "more-space",         query: "small bathroom remodel open spacious layout" },
  { slug: "energy-efficient",   query: "eco friendly bathroom renovation energy efficient" },
  { slug: "accessibility",      query: "accessible bathroom renovation walk in shower grab bars" },
  { slug: "family-friendly",    query: "family friendly bathroom kids safe durable" },
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
  for (const r of results) {
    const imgUrl = r.original || r.thumbnail;
    if (imgUrl && !imgUrl.includes("x-raw-image")) return imgUrl;
  }
  return null;
}

async function downloadImage(imgUrl, filePath) {
  const res = await fetch(imgUrl, { redirect: "follow" });
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

  const manifest = {};

  for (const goal of GOALS) {
    const outBase = path.join(OUT_DIR, `${goal.slug}.jpg`);
    if (fs.existsSync(outBase) || fs.existsSync(outBase.replace(".jpg", ".png")) || fs.existsSync(outBase.replace(".jpg", ".webp"))) {
      console.log(`⏭  ${goal.slug} — already exists, skipping`);
      const existing = [outBase, outBase.replace(".jpg", ".png"), outBase.replace(".jpg", ".webp")].find(f => fs.existsSync(f));
      manifest[goal.slug] = `/images/goals/${path.basename(existing)}`;
      continue;
    }

    try {
      console.log(`🔍 Searching: ${goal.query}`);
      const imgUrl = await searchImage(goal.query);
      if (!imgUrl) {
        console.log(`❌ No image found for ${goal.slug}`);
        continue;
      }
      console.log(`⬇️  Downloading: ${goal.slug}`);
      const { finalPath, size } = await downloadImage(imgUrl, outBase);
      manifest[goal.slug] = `/images/goals/${path.basename(finalPath)}`;
      console.log(`✅ ${goal.slug} — ${(size / 1024).toFixed(0)} KB`);
    } catch (err) {
      console.error(`❌ ${goal.slug}: ${err.message}`);
    }

    // Rate-limit: 1 second between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  // Write manifest
  const manifestPath = path.join(OUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📄 Manifest written to ${manifestPath}`);
}

main();
