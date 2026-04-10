/**
 * Budget Graph — a deterministic, knowledge-graph-style budget engine.
 *
 * Instead of calling an LLM every time an input changes, this engine
 * models the budget as a directed acyclic graph of computation nodes.
 * The graph is pure data — no side effects, no API calls.
 * Call `computeBudgetGraph(inputs)` to get the full result.
 */

import type { BathroomSize } from "../room-sizes/bathroom";

/* ─── Types ─── */

/** A price override from a real moodboard selection */
export interface PriceOverride {
  /** The must-have / nice-to-have label this replaces */
  itemLabel: string;
  /** Actual material cost from the product listing */
  materialCost: number;
  /** Estimated labor cost (can be auto-calculated) */
  laborCost: number;
}

export interface BudgetGraphInput {
  roomSize: BathroomSize;
  /** Actual room area in sq ft — when provided, narrows the base cost range */
  roomSqft?: number | null;
  scope: string | null;
  mustHaves: string[];
  niceToHaves: string[];
  includeNiceToHaves: boolean;
  customerBudget: number | null;
  /** Real prices from moodboard product selections */
  priceOverrides?: PriceOverride[];
}

export interface BudgetGraphBreakdownItem {
  category: string;
  pct: number;
  amount: number; // mid-point for display
  lowAmount: number;
  highAmount: number;
}

/** Per-item cost breakdown (material + labor) */
export interface ItemCostBreakdown {
  label: string;
  materialLow: number;
  materialHigh: number;
  laborLow: number;
  laborHigh: number;
  totalLow: number;
  totalHigh: number;
  /** True when a real moodboard price replaced the estimate */
  overridden: boolean;
  source: "must-have" | "nice-to-have";
}

export interface BudgetGraphResult {
  estimatedLow: number;
  estimatedHigh: number;
  estimatedMid: number;
  breakdown: BudgetGraphBreakdownItem[];
  /** Per-item material + labor breakdown */
  itemBreakdown: ItemCostBreakdown[];
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

/** Typical sqft range per bathroom type — used to interpolate when actual sqft is known */
const SQFT_RANGE: Record<BathroomSize, { low: number; high: number }> = {
  "half-bath":      { low: 15, high: 30 },
  "three-quarter":  { low: 30, high: 50 },
  "full-bath":      { low: 50, high: 80 },
  "primary":        { low: 80, high: 150 },
};

function resolveBaseCost(roomSize: BathroomSize, roomSqft?: number | null): { low: number; high: number } {
  const base = BASE_COST[roomSize] ?? BASE_COST["full-bath"];
  if (!roomSqft || roomSqft <= 0) return base;

  const sqftRange = SQFT_RANGE[roomSize] ?? SQFT_RANGE["full-bath"];
  const t = Math.max(0, Math.min(1, (roomSqft - sqftRange.low) / (sqftRange.high - sqftRange.low)));

  const costSpan = base.high - base.low;
  const midCost = base.low + costSpan * t;
  const margin = costSpan * 0.10;
  return {
    low: Math.max(base.low, Math.round(midCost - margin)),
    high: Math.min(base.high, Math.round(midCost + margin)),
  };
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

const MATERIAL_PCT: Record<string, number> = {
  "New tile (floor)":           0.45,
  "New tile (shower walls)":    0.45,
  "Non-slip flooring":          0.45,
  "Heated floors":              0.45,
  "Single vanity":              0.55,
  "Double vanity":              0.55,
  "Comfort-height toilet":      0.50,
  "Bidet/bidet seat":           0.50,
  "Exhaust fan upgrade":        0.35,
  "Recessed lighting":          0.35,
  "Dimmer switches":            0.40,
  "Under-cabinet lighting":     0.40,
  "LED mirror":                 0.65,
  "Walk-in shower":             0.45,
  "Bathtub":                    0.45,
  "Glass shower door":          0.55,
  "Rain showerhead":            0.60,
  "Handheld showerhead":        0.60,
  "Medicine cabinet":           0.55,
  "Built-in shelving":          0.40,
  "Towel warmer":               0.60,
  "Grab bars":                  0.45,
};

const DEFAULT_MATERIAL_PCT = 0.50;

const ITEM_COST: Record<string, { low: number; high: number }> = {
  "New tile (floor)":           { low: 1_200, high: 3_500 },
  "New tile (shower walls)":    { low: 1_500, high: 4_000 },
  "Non-slip flooring":          { low: 800,   high: 2_500 },
  "Heated floors":              { low: 1_500, high: 3_500 },
  "Single vanity":              { low: 800,   high: 2_500 },
  "Double vanity":              { low: 1_500, high: 4_000 },
  "Comfort-height toilet":      { low: 400,   high: 1_200 },
  "Bidet/bidet seat":           { low: 400,   high: 1_500 },
  "Exhaust fan upgrade":        { low: 600,   high: 1_800 },
  "Recessed lighting":          { low: 500,   high: 1_500 },
  "Dimmer switches":            { low: 150,   high: 500 },
  "Under-cabinet lighting":     { low: 200,   high: 600 },
  "LED mirror":                 { low: 300,   high: 1_200 },
  "Walk-in shower":             { low: 2_500, high: 6_000 },
  "Bathtub":                    { low: 1_200, high: 4_000 },
  "Glass shower door":          { low: 800,   high: 2_500 },
  "Rain showerhead":            { low: 200,   high: 800 },
  "Handheld showerhead":        { low: 100,   high: 400 },
  "Medicine cabinet":           { low: 300,   high: 1_000 },
  "Built-in shelving":          { low: 300,   high: 1_200 },
  "Towel warmer":               { low: 250,   high: 800 },
  "Grab bars":                  { low: 150,   high: 500 },
};

const DEFAULT_ITEM_COST = { low: 500, high: 1_500 };

function resolveItemBreakdown(
  items: string[],
  source: "must-have" | "nice-to-have",
  overrides: PriceOverride[],
): { breakdown: ItemCostBreakdown[]; totalLow: number; totalHigh: number } {
  const result: ItemCostBreakdown[] = [];
  let totalLow = 0;
  let totalHigh = 0;

  for (const label of items) {
    const override = overrides.find((o) => o.itemLabel === label);
    if (override) {
      const total = override.materialCost + override.laborCost;
      result.push({
        label,
        materialLow: override.materialCost,
        materialHigh: override.materialCost,
        laborLow: override.laborCost,
        laborHigh: override.laborCost,
        totalLow: total,
        totalHigh: total,
        overridden: true,
        source,
      });
      totalLow += total;
      totalHigh += total;
    } else {
      const cost = ITEM_COST[label] ?? DEFAULT_ITEM_COST;
      const matPct = MATERIAL_PCT[label] ?? DEFAULT_MATERIAL_PCT;
      const labPct = 1 - matPct;
      result.push({
        label,
        materialLow: Math.round(cost.low * matPct),
        materialHigh: Math.round(cost.high * matPct),
        laborLow: Math.round(cost.low * labPct),
        laborHigh: Math.round(cost.high * labPct),
        totalLow: cost.low,
        totalHigh: cost.high,
        overridden: false,
        source,
      });
      totalLow += cost.low;
      totalHigh += cost.high;
    }
  }

  return { breakdown: result, totalLow, totalHigh };
}

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
  const base = resolveBaseCost(input.roomSize, input.roomSqft);
  const scopeMultiplier = resolveScopeMultiplier(input.scope);

  const overrides = input.priceOverrides ?? [];
  const mustHaveBreakdown = resolveItemBreakdown(input.mustHaves, "must-have", overrides);

  const activeNiceToHaves = input.includeNiceToHaves ? input.niceToHaves : [];
  const niceToHaveBreakdown = resolveItemBreakdown(activeNiceToHaves, "nice-to-have", overrides);

  const wizardLabels = new Set([...input.mustHaves, ...activeNiceToHaves]);
  const additionalOverrides = overrides.filter((o) => !wizardLabels.has(o.itemLabel));
  const additionalBreakdown: ItemCostBreakdown[] = additionalOverrides.map((o) => {
    const total = o.materialCost + o.laborCost;
    return {
      label: o.itemLabel,
      materialLow: o.materialCost,
      materialHigh: o.materialCost,
      laborLow: o.laborCost,
      laborHigh: o.laborCost,
      totalLow: total,
      totalHigh: total,
      overridden: true,
      source: "must-have" as const,
    };
  });

  const itemBreakdown = [...mustHaveBreakdown.breakdown, ...niceToHaveBreakdown.breakdown, ...additionalBreakdown];

  const itemMaterialLow = itemBreakdown.reduce((s, i) => s + i.materialLow, 0);
  const itemMaterialHigh = itemBreakdown.reduce((s, i) => s + i.materialHigh, 0);
  const itemLaborLow = itemBreakdown.reduce((s, i) => s + i.laborLow, 0);
  const itemLaborHigh = itemBreakdown.reduce((s, i) => s + i.laborHigh, 0);

  const overheadLow = Math.round(base.low * scopeMultiplier);
  const overheadHigh = Math.round(base.high * scopeMultiplier);

  const materialsLow = itemMaterialLow + Math.round(overheadLow * 0.30);
  const materialsHigh = itemMaterialHigh + Math.round(overheadHigh * 0.30);
  const laborLow = itemLaborLow + Math.round(overheadLow * 0.70);
  const laborHigh = itemLaborHigh + Math.round(overheadHigh * 0.70);

  const constructionLow = materialsLow + laborLow;
  const constructionHigh = materialsHigh + laborHigh;

  const permitsLow = Math.round(constructionLow * 0.05);
  const permitsHigh = Math.round(constructionHigh * 0.05);
  const contingencyLow = Math.round(constructionLow * 0.10);
  const contingencyHigh = Math.round(constructionHigh * 0.10);
  const designLow = Math.round(constructionLow * 0.05);
  const designHigh = Math.round(constructionHigh * 0.05);

  const estimatedLow = Math.round(
    (constructionLow + permitsLow + contingencyLow + designLow) / 100
  ) * 100;
  const estimatedHigh = Math.round(
    (constructionHigh + permitsHigh + contingencyHigh + designHigh) / 100
  ) * 100;
  const estimatedMid = Math.round((estimatedLow + estimatedHigh) / 2);

  const grandMid = estimatedMid || 1;

  const breakdown: BudgetGraphBreakdownItem[] = [
    {
      category: "Materials",
      pct: Math.round(((materialsLow + materialsHigh) / 2 / grandMid) * 100),
      amount: Math.round((materialsLow + materialsHigh) / 2),
      lowAmount: materialsLow,
      highAmount: materialsHigh,
    },
    {
      category: "Labor",
      pct: Math.round(((laborLow + laborHigh) / 2 / grandMid) * 100),
      amount: Math.round((laborLow + laborHigh) / 2),
      lowAmount: laborLow,
      highAmount: laborHigh,
    },
    {
      category: "Permits & Fees",
      pct: Math.round(((permitsLow + permitsHigh) / 2 / grandMid) * 100),
      amount: Math.round((permitsLow + permitsHigh) / 2),
      lowAmount: permitsLow,
      highAmount: permitsHigh,
    },
    {
      category: "Contingency",
      pct: Math.round(((contingencyLow + contingencyHigh) / 2 / grandMid) * 100),
      amount: Math.round((contingencyLow + contingencyHigh) / 2),
      lowAmount: contingencyLow,
      highAmount: contingencyHigh,
    },
    {
      category: "Design & Planning",
      pct: Math.round(((designLow + designHigh) / 2 / grandMid) * 100),
      amount: Math.round((designLow + designHigh) / 2),
      lowAmount: designLow,
      highAmount: designHigh,
    },
  ];

  const mustHaveCosts = { low: mustHaveBreakdown.totalLow, high: mustHaveBreakdown.totalHigh };
  const niceToHaveCosts = { low: niceToHaveBreakdown.totalLow, high: niceToHaveBreakdown.totalHigh };

  const budgetWarning = resolveWarning(input.customerBudget, estimatedLow, estimatedHigh);

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
    itemBreakdown,
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
