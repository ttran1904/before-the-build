import type { BudgetEstimateInput } from "../types";
import { bathroomBudgetPrompt } from "./bathroom";

export type RoomType = "bathroom" | "kitchen" | "bedroom" | "living-room";

const promptRegistry: Record<RoomType, (input: BudgetEstimateInput) => string> = {
  bathroom: bathroomBudgetPrompt,
  kitchen: bathroomBudgetPrompt,       // fallback for now
  bedroom: bathroomBudgetPrompt,       // fallback for now
  "living-room": bathroomBudgetPrompt, // fallback for now
};

/**
 * Get the budget estimation prompt for a given room type.
 * Falls back to bathroom prompt if room type is not yet specialized.
 */
export function getBudgetPrompt(roomType: RoomType, input: BudgetEstimateInput): string {
  const promptFn = promptRegistry[roomType] || bathroomBudgetPrompt;
  return promptFn(input);
}
