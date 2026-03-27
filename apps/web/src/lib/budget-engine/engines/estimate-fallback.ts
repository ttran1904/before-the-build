import type { BudgetEstimateInput, BudgetEstimateResult, BreakdownLineItem } from "../types";

/**
 * Deterministic fallback budget estimator used when the Anthropic API key
 * is unavailable. Uses lookup tables based on bathroom size × scope.
 *
 * These numbers reflect 2024-2026 US national averages.
 */

const BASE_COST: Record<string, { low: number; high: number }> = {
  "half-bath":      { low: 3_000,  high: 8_000 },
  "three-quarter":  { low: 6_000,  high: 15_000 },
  "full-bath":      { low: 10_000, high: 25_000 },
  "primary":        { low: 18_000, high: 45_000 },
};

const SCOPE_MULTIPLIER: Record<string, number> = {
  cosmetic:  0.35,
  partial:   0.65,
  full:      1.0,
  addition:  1.6,
};

/**
 * Installed cost per item (materials + labor). Keys must match the
 * exact labels from the MUST_HAVE_GALLERY in the bathroom wizard.
 * Costs reflect 2024-2026 US national averages for supply + install.
 */
const ITEM_INSTALLED_COST: Record<string, { low: number; high: number }> = {
  // ── Tile & Flooring ──
  "New tile (floor)":           { low: 1_200, high: 3_500 },
  "New tile (shower walls)":    { low: 1_500, high: 4_000 },
  "Non-slip flooring":          { low: 800,   high: 2_500 },
  "Heated floors":              { low: 1_500, high: 3_500 },

  // ── Vanities & Sinks ──
  "Single vanity":              { low: 800,   high: 2_500 },
  "Double vanity":              { low: 1_500, high: 4_000 },

  // ── Toilet ──
  "Comfort-height toilet":      { low: 400,   high: 1_200 },
  "Bidet/bidet seat":           { low: 400,   high: 1_500 },

  // ── Ventilation & Electrical ──
  "Exhaust fan upgrade":        { low: 600,   high: 1_800 },
  "Recessed lighting":          { low: 500,   high: 1_500 },
  "Dimmer switches":            { low: 150,   high: 500 },
  "Under-cabinet lighting":     { low: 200,   high: 600 },
  "LED mirror":                 { low: 300,   high: 1_200 },

  // ── Shower & Tub ──
  "Walk-in shower":             { low: 2_500, high: 6_000 },
  "Bathtub":                    { low: 1_200, high: 4_000 },
  "Glass shower door":          { low: 800,   high: 2_500 },
  "Rain showerhead":            { low: 200,   high: 800 },
  "Handheld showerhead":        { low: 100,   high: 400 },

  // ── Storage & Fixtures ──
  "Medicine cabinet":           { low: 300,   high: 1_000 },
  "Built-in shelving":          { low: 300,   high: 1_200 },
  "Towel warmer":               { low: 250,   high: 800 },
  "Grab bars":                  { low: 150,   high: 500 },
};

/** Default per-item cost range when an item isn't in the lookup table. */
const DEFAULT_ITEM_COST = { low: 500, high: 1_500 };

/**
 * Nice-to-haves use full installed cost (not a fraction). They are real
 * items that affect materials, labor, permits, and contingency just like
 * must-haves. The only difference is priority — the customer can defer them.
 */

const BREAKDOWN_PCTS: { category: string; pct: number }[] = [
  { category: "Materials",         pct: 45 },
  { category: "Labor",             pct: 35 },
  { category: "Permits & Fees",    pct: 5 },
  { category: "Contingency",       pct: 10 },
  { category: "Design & Planning", pct: 5 },
];

export function estimateBudgetFallback(input: BudgetEstimateInput): BudgetEstimateResult {
  const base = BASE_COST[input.roomSize] || BASE_COST["full-bath"];
  const scopeMul = SCOPE_MULTIPLIER[input.scope] ?? 1.0;

  let addLow = 0;
  let addHigh = 0;

  for (const item of input.mustHaves) {
    const cost = ITEM_INSTALLED_COST[item] ?? DEFAULT_ITEM_COST;
    addLow += cost.low;
    addHigh += cost.high;
  }

  for (const item of input.niceToHaves) {
    const cost = ITEM_INSTALLED_COST[item] ?? DEFAULT_ITEM_COST;
    addLow += cost.low;
    addHigh += cost.high;
  }

  const estimatedLow = Math.round((base.low * scopeMul + addLow) / 100) * 100;
  const estimatedHigh = Math.round((base.high * scopeMul + addHigh) / 100) * 100;

  const breakdown: BreakdownLineItem[] = BREAKDOWN_PCTS.map((b) => ({
    category: b.category,
    pct: b.pct,
    lowAmount: Math.round((estimatedLow * b.pct) / 100),
    highAmount: Math.round((estimatedHigh * b.pct) / 100),
  }));

  // Compare to customer budget
  let budgetWarning: string | null = null;
  const custBudget = input.customerBudget;
  if (custBudget != null && custBudget > 0) {
    if (custBudget < estimatedLow) {
      const midpoint = (estimatedLow + estimatedHigh) / 2;
      const pctBelow = Math.round(((estimatedLow - custBudget) / midpoint) * 100);
      budgetWarning =
        `Your budget of $${custBudget.toLocaleString()} is about ${pctBelow}% below our estimated range ` +
        `($${estimatedLow.toLocaleString()}–$${estimatedHigh.toLocaleString()}). ` +
        `Consider increasing your budget or reducing scope to avoid mid-project cost surprises.`;
    } else if (custBudget > estimatedHigh) {
      budgetWarning =
        `Your budget of $${custBudget.toLocaleString()} exceeds our estimated range ` +
        `($${estimatedLow.toLocaleString()}–$${estimatedHigh.toLocaleString()}). ` +
        `You have room to upgrade materials or add nice-to-haves.`;
    }
  }

  const scopeLabel = input.scope === "cosmetic" ? "cosmetic refresh" :
    input.scope === "partial" ? "partial remodel" :
    input.scope === "addition" ? "addition/expansion" : "full remodel";

  const nthNote = input.niceToHaves.length > 0
    ? ` Plus ${input.niceToHaves.length} nice-to-have item(s) adding to the total.`
    : "";

  return {
    estimatedLow,
    estimatedHigh,
    breakdown,
    budgetWarning,
    rationale:
      `A ${scopeLabel} for a ${input.roomSize.replace("-", " ")} with ` +
      `${input.mustHaves.length} must-have item(s) typically costs ` +
      `$${estimatedLow.toLocaleString()}–$${estimatedHigh.toLocaleString()} in the current market.${nthNote} ` +
      `This includes materials, labor, permits, and a 10% contingency buffer.`,
  };
}
