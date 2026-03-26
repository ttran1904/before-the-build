import type { CropBox } from "../types";
import { bathroomIdentifyPrompt } from "./bathroom";

export type RoomType = "bathroom" | "kitchen" | "bedroom" | "living-room";

const promptRegistry: Record<RoomType, (cropBox: CropBox) => string> = {
  bathroom: bathroomIdentifyPrompt,
  // Add new rooms here as they are built:
  // kitchen: kitchenIdentifyPrompt,
  // bedroom: bedroomIdentifyPrompt,
  // "living-room": livingRoomIdentifyPrompt,
  kitchen: bathroomIdentifyPrompt,       // fallback for now
  bedroom: bathroomIdentifyPrompt,       // fallback for now
  "living-room": bathroomIdentifyPrompt, // fallback for now
};

/**
 * Get the identification prompt for a given room type.
 * Falls back to bathroom prompt if room type is not yet specialized.
 */
export function getIdentifyPrompt(roomType: RoomType, cropBox: CropBox): string {
  const promptFn = promptRegistry[roomType] || bathroomIdentifyPrompt;
  return promptFn(cropBox);
}
