"use client";

import type { BathroomWizardState } from "@/lib/store";
import {
  useGroundworkStore,
  type GroundworkBathroomState,
  type ProjectType,
  type BathroomKind,
  type BudgetTier as GwBudgetTier,
} from "@/lib/groundwork/store";

/** Map legacy wizard scope → new groundwork project type. */
function mapProjectType(
  scope: BathroomWizardState["scope"]
): ProjectType | null {
  switch (scope) {
    case "cosmetic":
      return "cosmetic_refresh";
    case "partial":
      return "pull_and_replace";
    case "full":
      return "full_gut";
    case "addition":
      return "layout_change";
    default:
      return null;
  }
}

function mapBathroomKind(
  size: BathroomWizardState["bathroomSize"]
): BathroomKind | null {
  switch (size) {
    case "half-bath":
      return "half_bath";
    case "three-quarter":
      return "three_quarter";
    case "full-bath":
      return "full_bath";
    case "primary":
      return "primary";
    default:
      return null;
  }
}

/** Map legacy budget (tier + raw amount) → new groundwork budget bucket. */
function mapBudgetTier(
  tier: BathroomWizardState["budgetTier"],
  amount: BathroomWizardState["budgetAmount"]
): GwBudgetTier | null {
  if (typeof amount === "number" && amount > 0) {
    if (amount < 10_000) return "under_10k";
    if (amount < 25_000) return "10_to_25k";
    if (amount < 50_000) return "25_to_50k";
    if (amount < 100_000) return "50_to_100k";
    return "above_100k";
  }
  switch (tier) {
    case "basic":
      return "under_10k";
    case "mid":
      return "10_to_25k";
    case "high":
      return "25_to_50k";
    default:
      return null;
  }
}

/** Translate everything the legacy wizard captured into the new
 *  Groundwork store, then commit it. Safe to call client-side only. */
export function importLegacyProjectIntoGroundwork(
  legacy: Partial<BathroomWizardState>
): GroundworkBathroomState {
  const projectType = mapProjectType(legacy.scope ?? null);
  const bathroomKind = mapBathroomKind(
    (legacy.bathroomSize ?? "full-bath") as BathroomWizardState["bathroomSize"]
  );
  const budgetTier = mapBudgetTier(
    legacy.budgetTier ?? null,
    legacy.budgetAmount ?? null
  );

  const notesParts: string[] = [];
  if (legacy.mustHaves?.length) {
    notesParts.push(`Must-haves: ${legacy.mustHaves.join(", ")}`);
  }
  if (legacy.niceToHaves?.length) {
    notesParts.push(`Nice-to-haves: ${legacy.niceToHaves.join(", ")}`);
  }

  const next: GroundworkBathroomState = {
    projectId: null,
    projectType,
    bathroomKind,
    goals: legacy.goals ?? [],
    urgency: null,
    propertyAddress: "",
    budgetTier,
    vanity: null,
    toilet: null,
    showerTub: null,
    flooring: null,
    walls: null,
    lighting: null,
    electrical: null,
    layout: null,
    intent: null,
    demo: null,
    plumbing: null,
    showerInScope: null,
    showerUpdate: null,
    showerSize: null,
    showerWidth: "",
    showerDepth: "",
    drainLocation: null,
    tileHeight: null,
    showerFeatures: [],
    fixtureSetup: null,
    fixtureStatus: null,
    fixtureBrand: "",
    showerGlass: null,
    vanityPlan: null,
    vanitySize: null,
    vanityWidth: "",
    vanityStatus: null,
    toiletPlan: null,
    tileStatus: null,
    tileKnownText: "",
    tileDirectionText: "",
    tileLook: null,
    wallTileExtent: null,
    showerFloorTile: null,
    grout: null,
    tileEdge: null,
    tileEdgeText: "",
    lightingChoices: [],
    electricalUpgrades: [],
    electricalFan: [],
    electricalFloor: null,
    electricalOutlets: null,
    electricalFixtures: [],
    electricalFixturesOther: "",
    paint: null,
    accessories: null,
    photos: legacy.mockupBathroomPhotos ?? [],
    floorPlan: [],
    inspirationLink: "",
    inspirationItems: [],
    notes: notesParts.join("\n"),
    completedAt: null,
  };

  useGroundworkStore.setState(next);
  return next;
}