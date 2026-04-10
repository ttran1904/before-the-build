import type { BudgetEstimateInput, BudgetEstimateResult, BreakdownLineItem } from "../types";
import type { BudgetRoomType } from "../prompts";
import { getBudgetPrompt } from "../prompts";

/**
 * Calls Claude to generate an independent budget estimate, then
 * compares it against the customer's stated budget to produce warnings.
 */
export async function estimateBudget(
  input: BudgetEstimateInput,
  roomType: BudgetRoomType,
  anthropicKey: string,
): Promise<BudgetEstimateResult> {
  const prompt = getBudgetPrompt(roomType, input);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.status}`);
  }

  const data = await res.json();
  const rawText: string = data.content?.[0]?.text?.trim() || "";

  // Extract JSON — Claude may wrap it in markdown fences
  const jsonMatch = rawText.match(/\{[\s\S]*"estimatedLow"\s*:[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse budget estimation response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const result: BudgetEstimateResult = {
    estimatedLow: parsed.estimatedLow,
    estimatedHigh: parsed.estimatedHigh,
    breakdown: parsed.breakdown as BreakdownLineItem[],
    rationale: parsed.rationale || "",
    budgetWarning: null,
  };

  // ── Compare customer budget vs. our estimate ──
  result.budgetWarning = generateBudgetWarning(
    input.customerBudget,
    result.estimatedLow,
    result.estimatedHigh,
  );

  return result;
}

/**
 * Compare the customer's stated budget against our independent estimate.
 * Returns a warning string if their budget is unrealistically low, or
 * null if it falls within our range.
 */
function generateBudgetWarning(
  customerBudget: number | null,
  estimatedLow: number,
  estimatedHigh: number,
): string | null {
  if (customerBudget == null || customerBudget <= 0) return null;

  const midpoint = (estimatedLow + estimatedHigh) / 2;
  const shortfall = estimatedLow - customerBudget;

  if (customerBudget < estimatedLow) {
    const pctBelow = Math.round((shortfall / midpoint) * 100);
    return (
      `Your budget of $${customerBudget.toLocaleString()} is about ${pctBelow}% below our estimated range ` +
      `($${estimatedLow.toLocaleString()}–$${estimatedHigh.toLocaleString()}). ` +
      `Consider increasing your budget or reducing scope to avoid mid-project cost surprises.`
    );
  }

  if (customerBudget > estimatedHigh) {
    return (
      `Your budget of $${customerBudget.toLocaleString()} exceeds our estimated range ` +
      `($${estimatedLow.toLocaleString()}–$${estimatedHigh.toLocaleString()}). ` +
      `You have room to upgrade materials or add nice-to-haves.`
    );
  }

  // Within range — no warning needed
  return null;
}
