import sharp from "sharp";
import type { CropBox, IdentificationResult } from "../types";
import type { RoomType } from "../prompts";
import { getIdentifyPrompt } from "../prompts";

/**
 * Downloads an image from a URL and returns it as a Buffer.
 */
async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Crops a region from a full image buffer using the normalized crop box (0–1 ratios).
 * Returns the cropped image as a base64-encoded JPEG.
 */
async function cropImage(
  imageBuffer: Buffer,
  cropBox: CropBox,
): Promise<string> {
  const metadata = await sharp(imageBuffer).metadata();
  const imgW = metadata.width || 1;
  const imgH = metadata.height || 1;

  // Convert normalized 0–1 ratios to pixel coordinates
  const left = Math.max(0, Math.round(cropBox.x * imgW));
  const top = Math.max(0, Math.round(cropBox.y * imgH));
  const width = Math.min(Math.round(cropBox.w * imgW), imgW - left);
  const height = Math.min(Math.round(cropBox.h * imgH), imgH - top);

  if (width < 1 || height < 1) {
    throw new Error("Crop region is too small");
  }

  const cropped = await sharp(imageBuffer)
    .extract({ left, top, width, height })
    .jpeg({ quality: 85 })
    .toBuffer();

  return cropped.toString("base64");
}

/**
 * Resizes the full image to a reasonable size for context (max 1024px wide).
 * Returns a base64-encoded JPEG.
 */
async function resizeFullImage(imageBuffer: Buffer): Promise<string> {
  const resized = await sharp(imageBuffer)
    .resize({ width: 1024, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  return resized.toString("base64");
}

/**
 * Uses Claude Vision to identify an item within a bounding-box region of an image.
 * Sends BOTH the cropped region and the full image for accurate identification.
 * Returns a label and search terms for product lookup.
 */
export async function identifyItem(
  imageUrl: string,
  cropBox: CropBox,
  roomType: RoomType,
  anthropicKey: string,
): Promise<IdentificationResult> {
  // Download and process the image server-side
  const imageBuffer = await downloadImage(imageUrl);
  const [croppedBase64, fullBase64] = await Promise.all([
    cropImage(imageBuffer, cropBox),
    resizeFullImage(imageBuffer),
  ]);

  const prompt = getIdentifyPrompt(roomType);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: croppedBase64,
              },
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: fullBase64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.content?.[0]?.text?.trim() || "";

  // Extract JSON from response — Claude may wrap it in markdown or add reasoning
  const jsonMatch = rawText.match(/\{[\s\S]*"label"\s*:\s*"[^"]+[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse identification response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    label: parsed.label || "Unknown item",
    searchTerms: parsed.searchTerms || parsed.label || "Unknown item",
  };
}
