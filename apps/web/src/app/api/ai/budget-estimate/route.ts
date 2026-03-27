import { NextRequest, NextResponse } from "next/server";
import { estimateBudget, estimateBudgetFallback } from "@/lib/budget-engine";
import type { BudgetEstimateInput } from "@/lib/budget-engine";
import type { RoomType } from "@/lib/budget-engine/prompts";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { goal, scope, mustHaves, niceToHaves, budgetTier, bathroomSize, customerBudget } = body;

  const input: BudgetEstimateInput = {
    roomType: "bathroom",
    goal: goal || "",
    scope: scope || "full",
    mustHaves: mustHaves || [],
    niceToHaves: niceToHaves || [],
    roomSize: bathroomSize || "full-bath",
    customerBudget: customerBudget ?? null,
  };

  const roomType: RoomType = "bathroom";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Deterministic fallback when no API key is available
    const fallback = estimateBudgetFallback(input);
    return NextResponse.json(fallback);
  }

  try {
    const result = await estimateBudget(input, roomType, apiKey);
    return NextResponse.json(result);
  } catch {
    // Fall back to deterministic estimator on any error
    const fallback = estimateBudgetFallback(input);
    return NextResponse.json(fallback);
  }
}
