"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ── Groundwork data model ──────────────────────────────────────
 * Standalone scope-definition product. Independent from the
 * design wizard store. Captures everything a contractor needs
 * to bid the same project (no design / moodboard / mockup).
 * ─────────────────────────────────────────────────────────────── */

export type ProjectType =
  | "cosmetic_refresh"
  | "pull_and_replace"
  | "full_gut"
  | "layout_change";

export type BathroomKind =
  | "half_bath"
  | "three_quarter"
  | "full_bath"
  | "primary";

export type Urgency = "asap" | "soonish" | "no_rush";

export type BudgetTier =
  | "under_10k"
  | "10_to_25k"
  | "25_to_50k"
  | "50_to_100k"
  | "above_100k";

/** What's happening to each fixture/zone. "unsure" is a first-class
 *  answer — it auto-feeds the open-items list. */
export type FixtureChange = "keep" | "replace" | "relocate" | "unsure";

export type WallChange =
  | "paint_only"
  | "new_tile"
  | "wallpaper"
  | "structural"
  | "unsure";

export type ElectricalChange =
  | "none"
  | "new_outlets"
  | "new_fixtures"
  | "major"
  | "unsure";

export type LayoutChange =
  | "none"
  | "door"
  | "wall"
  | "full_layout"
  | "unsure";

export interface GroundworkBathroomState {
  // Project tab
  projectType: ProjectType | null;
  bathroomKind: BathroomKind | null;
  goals: string[];
  urgency: Urgency | null;
  budgetTier: BudgetTier | null;

  // Scope tab — what's changing
  vanity: FixtureChange | null;
  toilet: FixtureChange | null;
  showerTub: FixtureChange | null;
  flooring: FixtureChange | null;
  walls: WallChange | null;
  lighting: FixtureChange | null;
  electrical: ElectricalChange | null;
  layout: LayoutChange | null;

  // Photos tab
  photos: string[];
  floorPlan: string[];
  notes: string;

  // Bookkeeping
  completedAt: string | null;
}

interface Actions {
  set: <K extends keyof GroundworkBathroomState>(
    key: K,
    value: GroundworkBathroomState[K]
  ) => void;
  reset: () => void;
  markComplete: () => void;
}

const initial: GroundworkBathroomState = {
  projectType: null,
  bathroomKind: null,
  goals: [],
  urgency: null,
  budgetTier: null,
  vanity: null,
  toilet: null,
  showerTub: null,
  flooring: null,
  walls: null,
  lighting: null,
  electrical: null,
  layout: null,
  photos: [],
  floorPlan: [],
  notes: "",
  completedAt: null,
};

export const useGroundworkStore = create<GroundworkBathroomState & Actions>()(
  persist(
    (set) => ({
      ...initial,
      set: (key, value) =>
        set({ [key]: value } as Partial<GroundworkBathroomState>),
      reset: () => set({ ...initial }),
      markComplete: () => set({ completedAt: new Date().toISOString() }),
    }),
    {
      name: "btb:groundwork:bathroom",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/* ── Derived helpers ───────────────────────────────────────────── */

/** Items the contractor needs to confirm — anywhere the user said
 *  "unsure" or skipped a question. */
export function getOpenItems(s: GroundworkBathroomState): string[] {
  const items: string[] = [];
  const checks: Array<[unknown, string]> = [
    [s.vanity, "Vanity: keep, replace, or relocate?"],
    [s.toilet, "Toilet: keep, replace, or relocate?"],
    [s.showerTub, "Shower or tub: keep, replace, or relocate?"],
    [s.flooring, "Flooring: keep or replace?"],
    [s.walls, "Walls: paint, tile, wallpaper, or structural?"],
    [s.lighting, "Lighting: keep, upgrade, or relocate?"],
    [s.electrical, "Electrical work needed?"],
    [s.layout, "Moving any walls or doors?"],
  ];
  for (const [val, label] of checks) {
    if (val === null || val === "unsure") items.push(label);
  }
  if (s.photos.length === 0) items.push("Current photos of the bathroom");
  if (s.floorPlan.length === 0) items.push("Floor plan or room dimensions");
  return items;
}

/** Assumptions the wizard auto-applied — true until told otherwise. */
export function getAssumptions(s: GroundworkBathroomState): string[] {
  const a: string[] = [];
  if (s.projectType === "cosmetic_refresh") {
    a.push("No plumbing relocation: existing rough-in is reused.");
    a.push("No structural framing changes.");
  }
  if (s.projectType === "pull_and_replace") {
    a.push(
      "Plumbing rough-in stays in place; fixtures swap on existing connections."
    );
  }
  if (s.electrical === "none") {
    a.push("No new circuits or panel work required.");
  }
  if (s.layout === "none") {
    a.push("Existing footprint and door swing are unchanged.");
  }
  if (s.walls === "paint_only") {
    a.push("Walls are sound — no drywall repair priced beyond minor patching.");
  }
  if (a.length === 0) {
    a.push(
      "Standard residential bathroom assumptions apply (permits, code compliance, debris haul-away)."
    );
  }
  return a;
}

/** Realistic cost range based on project type + bathroom kind. */
export function getRealisticCostRange(s: GroundworkBathroomState): {
  low: number;
  high: number;
  label: string;
} {
  const base: Record<ProjectType, [number, number]> = {
    cosmetic_refresh: [3_000, 8_000],
    pull_and_replace: [10_000, 25_000],
    full_gut: [25_000, 60_000],
    layout_change: [40_000, 90_000],
  };
  const [lo, hi] = base[s.projectType ?? "pull_and_replace"];
  const mult =
    s.bathroomKind === "primary"
      ? 1.4
      : s.bathroomKind === "half_bath"
      ? 0.6
      : 1;
  const low = Math.round((lo * mult) / 500) * 500;
  const high = Math.round((hi * mult) / 500) * 500;
  return {
    low,
    high,
    label: `$${low.toLocaleString()} – $${high.toLocaleString()}`,
  };
}

/** Plain-English project-type label. */
export function projectTypeLabel(t: ProjectType | null): string {
  switch (t) {
    case "cosmetic_refresh":
      return "Cosmetic refresh";
    case "pull_and_replace":
      return "Pull and replace";
    case "full_gut":
      return "Full gut";
    case "layout_change":
      return "Layout change";
    default:
      return "Not yet selected";
  }
}
