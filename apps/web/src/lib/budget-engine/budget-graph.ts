/**
 * Budget Graph — a deterministic, knowledge-graph-style budget engine.
 *
 * Instead of calling an LLM every time an input changes, this engine
 * models the budget as a **directed acyclic graph** of computation nodes.
 * Each node owns one cost factor and can be independently recalculated
 * when its upstream input changes.
 *
 * ┌──────────────┐   ┌─────────────┐   ┌──────────────────┐
 * │  Base Cost   │   │ Scope Mult  │   │  Item Costs      │
 * │ (room size)  │   │ (scope)     │   │ (must + nice)    │
 * └──────┬───────┘   └──────┬──────┘   └────────┬─────────┘
 *        │                  │                    │
 *        └──────────────────┼────────────────────┘
 *                           ▼
 *                   ┌───────────────┐
 *                   │  Total Range  │
 *                   │  (low–high)   │
 *                   └───────┬───────┘
 *                           │
 *              ┌────────────┼────────────┐
 *              ▼            ▼            ▼
 *        ┌──────────┐ ┌──────────┐ ┌──────────┐
 *        │Materials │ │  Labor   │ │Permits…  │
 *        │  (45%)   │ │  (35%)   │ │  (5%)    │
 *        └──────────┘ └──────────┘ └──────────┘
 *
 * The graph is pure data — no side effects, no API calls.
 * Call `computeBudgetGraph(inputs)` to get the full result.
 */

import type { BathroomSize } from "@/lib/room-sizes/bathroom";

/* ─── Types ─── */

export interface BudgetGraphInput {
  roomSize: BathroomSize;
  scope: string | null;
  mustHaves: string[];
  niceToHaves: string[];
  includeNiceToHaves: boolean;
  customerBudget: number | null;
}

export interface BudgetGraphBreakdownItem {
  category: string;
  pct: number;
  amount: number; // mid-point for display
  lowAmount: number;
  highAmount: number;
}

export interface BudgetGraphResult {
  estimatedLow: number;
  estimatedHigh: number;
  estimatedMid: number;
  breakdown: BudgetGraphBreakdownItem[];
  budgetWarning: string | null;
  rationale: string;
  /** Individual cost nodes — lets callers see what changed */
  nodes: {
    baseLow: number;
    baseHigh: number;
    scopeMultiplier: number;
    itemsLow: number;
    itemsHigh: number;
    niceToHavesLow: number;
    niceToHavesHigh: number;
  };
}

/* ─── Node 1: Base cost by room size ─── */

const BASE_COST: Record<BathroomSize, { low: number; high: number }> = {
  "half-bath":      { low: 3_000,  high: 8_000 },
  "three-quarter":  { low: 6_000,  high: 15_000 },
  "full-bath":      { low: 10_000, high: 25_000 },
  "primary":        { low: 18_000, high: 45_000 },
};

function resolveBaseCost(roomSize: BathroomSize): { low: number; high: number } {
  return BASE_COST[roomSize] ?? BASE_COST["full-bath"];
}

/* ─── Node 2: Scope multiplier ─── */

const SCOPE_MULTIPLIER: Record<string, number> = {
  cosmetic:  0.35,
  partial:   0.65,
  full:      1.0,
  addition:  1.6,
};

function resolveScopeMultiplier(scope: string | null): number {
  if (!scope) return 1.0;
  return SCOPE_MULTIPLIER[scope] ?? 1.0;
}

/* ─── Node 3: Item installed costs ─── */

const ITEM_COST: Record<string, { low: number; high: number }> = {
  // Tile & Flooring
  "New tile (floor)":           { low: 1_200, high: 3_500 },
  "New tile (shower walls)":    { low: 1_500, high: 4_000 },
  "Non-slip flooring":          { low: 800,   high: 2_500 },
  "Heated floors":              { low: 1_500, high: 3_500 },
  // Vanities & Sinks
  "Single vanity":              { low: 800,   high: 2_500 },
  "Double vanity":              { low: 1_500, high: 4_000 },
  // Toilet
  "Comfort-height toilet":      { low: 400,   high: 1_200 },
  "Bidet/bidet seat":           { low: 400,   high: 1_500 },
  // Ventilation & Electrical
  "Exhaust fan upgrade":        { low: 600,   high: 1_800 },
  "Recessed lighting":          { low: 500,   high: 1_500 },
  "Dimmer switches":            { low: 150,   high: 500 },
  "Under-cabinet lighting":     { low: 200,   high: 600 },
  "LED mirror":                 { low: 300,   high: 1_200 },
  // Shower & Tub
  "Walk-in shower":             { low: 2_500, high: 6_000 },
  "Bathtub":                    { low: 1_200, high: 4_000 },
  "Glass shower door":          { low: 800,   high: 2_500 },
  "Rain showerhead":            { low: 200,   high: 800 },
  "Handheld showerhead":        { low: 100,   high: 400 },
  // Storage & Fixtures
  "Medicine cabinet":           { low: 300,   high: 1_000 },
  "Built-in shelving":          { low: 300,   high: 1_200 },
  "Towel warmer":               { low: 250,   high: 800 },
  "Grab bars":                  { low: 150,   high: 500 },
};

const DEFAULT_ITEM_COST = { low: 500, high: 1_500 };

function resolveItemCosts(items: string[]): { low: number; high: number } {
  let low = 0;
  let high = 0;
  for (const item of items) {
    const cost = ITEM_COST[item] ?? DEFAULT_ITEM_COST;
    low += cost.low;
    high += cost.high;
  }
  return { low, high };
}

/* ─── Node 4: Breakdown percentages ─── */

const BREAKDOWN_PCTS: { category: string; pct: number }[] = [
  { category: "Materials",         pct: 45 },
  { category: "Labor",             pct: 35 },
  { category: "Permits & Fees",    pct: 5 },
  { category: "Contingency",       pct: 10 },
  { category: "Design & Planning", pct: 5 },
];

/* ─── Node 5: Budget comparison / warning ─── */

function resolveWarning(
  customerBudget: number | null,
  estimatedLow: number,
  estimatedHigh: number,
): string | null {
  if (customerBudget == null || customerBudget <= 0) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  if (customerBudget < estimatedLow) {
    const midpoint = (estimatedLow + estimatedHigh) / 2;
    const pctBelow = Math.round(((estimatedLow - customerBudget) / midpoint) * 100);
    return (
      `Your budget of ${fmt(customerBudget)} is about ${pctBelow}% below our estimated range ` +
      `(${fmt(estimatedLow)}–${fmt(estimatedHigh)}). ` +
      `Consider increasing your budget or reducing scope to avoid mid-project cost surprises.`
    );
  }

  if (customerBudget > estimatedHigh) {
    return (
      `Your budget of ${fmt(customerBudget)} exceeds our estimated range ` +
      `(${fmt(estimatedLow)}–${fmt(estimatedHigh)}). ` +
      `You have room to upgrade materials or add nice-to-haves.`
    );
  }

  return null;
}

/* ─── Graph computation ─── */

export function computeBudgetGraph(input: BudgetGraphInput): BudgetGraphResult {
  // Node 1: base cost
  const base = resolveBaseCost(input.roomSize);

  // Node 2: scope multiplier
  const scopeMultiplier = resolveScopeMultiplier(input.scope);

  // Node 3a: must-have items
  const mustHaveCosts = resolveItemCosts(input.mustHaves);

  // Node 3b: nice-to-have items (only if included)
  const activeNiceToHaves = input.includeNiceToHaves ? input.niceToHaves : [];
  const niceToHaveCosts = resolveItemCosts(activeNiceToHaves);

  // Aggregate: total = base × scope + items
  const estimatedLow = Math.round(
    (base.low * scopeMultiplier + mustHaveCosts.low + niceToHaveCosts.low) / 100
  ) * 100;
  const estimatedHigh = Math.round(
    (base.high * scopeMultiplier + mustHaveCosts.high + niceToHaveCosts.high) / 100
  ) * 100;
  const estimatedMid = Math.round((estimatedLow + estimatedHigh) / 2);

  // Node 4: breakdown
  const breakdown: BudgetGraphBreakdownItem[] = BREAKDOWN_PCTS.map((b) => {
    const lowAmount = Math.round((estimatedLow * b.pct) / 100);
    const highAmount = Math.round((estimatedHigh * b.pct) / 100);
    return {
      category: b.category,
      pct: b.pct,
      amount: Math.round((lowAmount + highAmount) / 2),
      lowAmount,
      highAmount,
    };
  });

  // Node 5: warning
  const budgetWarning = resolveWarning(input.customerBudget, estimatedLow, estimatedHigh);

  // Rationale
  const scopeLabel = input.scope === "cosmetic" ? "cosmetic refresh"
    : input.scope === "partial" ? "partial remodel"
    : input.scope === "addition" ? "addition/expansion"
    : "full remodel";

  const nthNote = activeNiceToHaves.length > 0
    ? ` Plus ${activeNiceToHaves.length} nice-to-have item(s) adding to the total.`
    : "";

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const rationale =
    `A ${scopeLabel} for a ${input.roomSize.replace(/-/g, " ")} with ` +
    `${input.mustHaves.length} must-have item(s) typically costs ` +
    `${fmt(estimatedLow)}–${fmt(estimatedHigh)} in the current market.${nthNote} ` +
    `This includes materials, labor, permits, and a 10% contingency buffer.`;

  return {
    estimatedLow,
    estimatedHigh,
    estimatedMid,
    breakdown,
    budgetWarning,
    rationale,
    nodes: {
      baseLow: base.low,
      baseHigh: base.high,
      scopeMultiplier,
      itemsLow: mustHaveCosts.low,
      itemsHigh: mustHaveCosts.high,
      niceToHavesLow: niceToHaveCosts.low,
      niceToHavesHigh: niceToHaveCosts.high,
    },
  };
}
