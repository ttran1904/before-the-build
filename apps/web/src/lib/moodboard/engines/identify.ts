import type { CropBox, IdentificationResult } from "../types";
import type { RoomType } from "../prompts";
import { getIdentifyPrompt } from "../prompts";

/**
 * Uses Claude Vision to identify an item within a bounding-box region of an image.
 * Returns a label and search terms for product lookup.
 */
export async function identifyItem(
  imageUrl: string,
  cropBox: CropBox,
  roomType: RoomType,
  anthropicKey: string,
): Promise<IdentificationResult> {
  const prompt = getIdentifyPrompt(roomType, cropBox);

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
              source: { type: "url", url: imageUrl },
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
