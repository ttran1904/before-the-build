import type { GroundworkBathroomState } from "./store";

/* ──────────────────────────────────────────────────────────────────
 * Bathroom Readiness Knowledge Graph
 *
 * A small, declarative graph of every meaningful intake answer for
 * a bathroom Groundwork scope. Each node is a "fact" — something a
 * contractor needs in order to bid an apples-to-apples job.
 *
 * Scoring rules:
 *  - Each fact contributes its weight to its dimension's denominator.
 *  - A fact is "resolved" when isResolved(s) is true (i.e. the user
 *    answered something concrete — not null, not "unsure", not blank).
 *  - When a fact is gated (e.g. "only relevant if shower in scope"),
 *    we set `relevant(s)=false` and the fact is removed from BOTH
 *    numerator and denominator — it no longer affects the score.
 *
 * Output:
 *  - per-dimension score (0–100)
 *  - overall weighted score
 *  - per-dimension list of unresolved facts (so the UI can surface
 *    them inline as "what to nail down next")
 * ────────────────────────────────────────────────────────────────── */

export type ReadinessDimensionKey =
  | "projectBasics"
  | "scopeDefinition"
  | "structuralClarity"
  | "fixtureSpecs"
  | "finishSelections"
  | "siteContext";

export interface ReadinessFact {
  /** Stable id for diffing / deep-linking back to the question. */
  id: string;
  /** Short, human label — what the homeowner will see if it's missing. */
  label: string;
  /** Plain-English nudge: "what does answering this unlock?" */
  hint?: string;
  /** Weight inside its dimension. Higher = matters more. */
  weight: number;
  /** True when this fact is concretely answered. */
  isResolved: (s: GroundworkBathroomState) => boolean;
  /** Optional gate. If false, the fact is dropped from scoring entirely. */
  relevant?: (s: GroundworkBathroomState) => boolean;
}

export interface ReadinessDimension {
  key: ReadinessDimensionKey;
  label: string;
  blurb: string;
  facts: ReadinessFact[];
}

export interface ReadinessFactStatus {
  id: string;
  label: string;
  hint?: string;
  resolved: boolean;
  relevant: boolean;
}

export interface ReadinessDimensionResult {
  key: ReadinessDimensionKey;
  label: string;
  blurb: string;
  /** 0–100. */
  score: number;
  /** Number of relevant facts. */
  total: number;
  /** Number of resolved relevant facts. */
  resolved: number;
  /** Per-fact status, useful for the UI breakdown. */
  facts: ReadinessFactStatus[];
  /** Just the missing labels — convenient for callouts. */
  missing: string[];
}

export interface ReadinessReport {
  overall: number;
  dimensions: ReadinessDimensionResult[];
  /** Flat list of every still-open fact across the whole intake. */
  allMissing: ReadinessFactStatus[];
  narrative: string;
}

/* ── helpers ───────────────────────────────────────────────────── */

const has = (v: unknown) =>
  v !== null && v !== undefined && v !== "" && v !== "unsure";

const arrHas = (v: unknown) => Array.isArray(v) && v.length > 0;

const arrHasResolved = (v: unknown) =>
  Array.isArray(v) &&
  v.length > 0 &&
  !v.includes("unsure") &&
  !v.includes("not_sure");

const showerInScope = (s: GroundworkBathroomState) =>
  s.bathroomKind !== "half_bath" && s.showerInScope !== "no";

const isPowderRoom = (s: GroundworkBathroomState) =>
  s.bathroomKind === "half_bath";

/* ── the graph ─────────────────────────────────────────────────── */

export const READINESS_GRAPH: ReadinessDimension[] = [
  {
    key: "projectBasics",
    label: "Project basics",
    blurb: "Who, where, and what kind of project this is.",
    facts: [
      {
        id: "bathroomKind",
        label: "Which bathroom",
        weight: 2,
        isResolved: (s) => has(s.bathroomKind),
      },
      {
        id: "intent",
        label: "Project intent",
        hint: "Refresh, replace, rethink — sets the tone for everything.",
        weight: 2,
        isResolved: (s) => has(s.intent),
      },
      {
        id: "projectType",
        label: "Project type",
        weight: 1,
        isResolved: (s) => has(s.projectType),
      },
      {
        id: "demo",
        label: "What's being removed",
        weight: 1,
        isResolved: (s) => has(s.demo),
      },
      {
        id: "urgency",
        label: "Timing / urgency",
        hint: "Helps a builder slot you into their schedule.",
        weight: 1,
        isResolved: (s) => has(s.urgency),
      },
      {
        id: "budgetTier",
        label: "Homeowner budget tier",
        hint: "Lets a builder steer specs to the right band.",
        weight: 2,
        isResolved: (s) => has(s.budgetTier),
      },
    ],
  },
  {
    key: "scopeDefinition",
    label: "Scope definition",
    blurb: "What's being kept, replaced, relocated, or added.",
    facts: [
      {
        id: "vanity",
        label: "Vanity plan",
        weight: 2,
        isResolved: (s) => has(s.vanityPlan),
      },
      {
        id: "toilet",
        label: "Toilet plan",
        weight: 1,
        isResolved: (s) => has(s.toiletPlan),
      },
      {
        id: "showerTub",
        label: "Shower / tub direction",
        weight: 2,
        isResolved: (s) => has(s.showerInScope) && (s.showerInScope === "no" || has(s.showerUpdate)),
        relevant: (s) => !isPowderRoom(s),
      },
      {
        id: "flooring",
        label: "Flooring decision",
        weight: 1,
        isResolved: (s) => has(s.flooring) || has(s.tileStatus),
      },
      {
        id: "walls",
        label: "Wall finish",
        weight: 1,
        isResolved: (s) => has(s.walls) || has(s.paint),
      },
      {
        id: "lighting",
        label: "Lighting plan",
        weight: 1,
        isResolved: (s) => arrHasResolved(s.lightingChoices),
      },
      {
        id: "electrical",
        label: "Electrical scope",
        weight: 1,
        isResolved: (s) => arrHasResolved(s.electricalUpgrades),
      },
      {
        id: "accessories",
        label: "Accessories & trim responsibility",
        hint: "Towel bars, mirror, hooks — supplied by you or builder?",
        weight: 1,
        isResolved: (s) => has(s.accessories),
      },
    ],
  },
  {
    key: "structuralClarity",
    label: "Structural & plumbing clarity",
    blurb: "What's behind the walls — the cost-driver category.",
    facts: [
      {
        id: "plumbing",
        label: "Plumbing layout (staying or moving)",
        weight: 2,
        isResolved: (s) => has(s.plumbing),
      },
      {
        id: "drainLocation",
        label: "Shower drain location",
        weight: 1,
        isResolved: (s) => has(s.drainLocation),
        relevant: (s) => showerInScope(s),
      },
      {
        id: "showerSize",
        label: "Shower footprint",
        weight: 1,
        isResolved: (s) =>
          s.showerSize === "known" ||
          (has(s.showerWidth) && has(s.showerDepth)) ||
          (has(s.showerSize) && s.showerSize !== "unsure"),
        relevant: (s) => showerInScope(s),
      },
      {
        id: "showerUpdate",
        label: "Shower scope (tub-to-shower, walk-in, surround…)",
        weight: 2,
        isResolved: (s) => has(s.showerUpdate),
        relevant: (s) => showerInScope(s),
      },
      {
        id: "tileHeight",
        label: "Wall-tile height",
        weight: 1,
        isResolved: (s) => has(s.tileHeight),
        relevant: (s) => showerInScope(s),
      },
      {
        id: "showerGlass",
        label: "Shower glass enclosure",
        weight: 1,
        isResolved: (s) => has(s.showerGlass),
        relevant: (s) => showerInScope(s),
      },
      {
        id: "electricalFan",
        label: "Exhaust fan plan",
        weight: 1,
        isResolved: (s) => arrHasResolved(s.electricalFan),
      },
      {
        id: "electricalFloor",
        label: "Heated floor decision",
        weight: 1,
        isResolved: (s) => has(s.electricalFloor),
      },
    ],
  },
  {
    key: "fixtureSpecs",
    label: "Fixture specs",
    blurb: "Specific brands, models, and dimensions — needed for accurate bids.",
    facts: [
      {
        id: "fixtureSetup",
        label: "Shower fixture setup (hand-held, rain, system)",
        weight: 1,
        isResolved: (s) => has(s.fixtureSetup),
        relevant: (s) => showerInScope(s),
      },
      {
        id: "fixtureStatus",
        label: "Shower fixture selected",
        weight: 2,
        isResolved: (s) => s.fixtureStatus === "selected",
        relevant: (s) => showerInScope(s),
      },
      {
        id: "fixtureBrand",
        label: "Shower fixture brand / model",
        weight: 1,
        isResolved: (s) => has(s.fixtureBrand),
        relevant: (s) => showerInScope(s) && s.fixtureStatus === "selected",
      },
      {
        id: "vanityStatus",
        label: "Vanity selected",
        weight: 2,
        isResolved: (s) => s.vanityStatus === "selected",
        relevant: (s) => s.vanityPlan !== "keep" && has(s.vanityPlan),
      },
      {
        id: "vanitySize",
        label: "Vanity dimensions",
        weight: 1,
        isResolved: (s) => s.vanitySize === "known" || has(s.vanityWidth),
        relevant: (s) => s.vanityPlan !== "keep" && has(s.vanityPlan),
      },
      {
        id: "toiletPlan",
        label: "Toilet supply (owner / builder)",
        weight: 1,
        isResolved: (s) => has(s.toiletPlan) && s.toiletPlan !== "keep" ? has(s.toiletPlan) : has(s.toiletPlan),
      },
    ],
  },
  {
    key: "finishSelections",
    label: "Finish selections",
    blurb: "Tile, grout, paint — small choices, big bid swings.",
    facts: [
      {
        id: "tileStatus",
        label: "Tile selection state",
        weight: 2,
        isResolved: (s) => s.tileStatus === "know",
      },
      {
        id: "tileLook",
        label: "Tile size / look",
        weight: 1,
        isResolved: (s) => has(s.tileLook),
      },
      {
        id: "wallTileExtent",
        label: "Wall-tile extent",
        weight: 2,
        isResolved: (s) => has(s.wallTileExtent),
        relevant: (s) => showerInScope(s),
      },
      {
        id: "showerFloorTile",
        label: "Shower floor tile (same or different)",
        weight: 1,
        isResolved: (s) => has(s.showerFloorTile),
        relevant: (s) => showerInScope(s),
      },
      {
        id: "grout",
        label: "Grout type",
        weight: 1,
        isResolved: (s) => has(s.grout),
      },
      {
        id: "tileEdge",
        label: "Tile edge profile",
        weight: 1,
        isResolved: (s) => has(s.tileEdge),
      },
      {
        id: "paint",
        label: "Paint plan",
        weight: 1,
        isResolved: (s) => has(s.paint),
      },
    ],
  },
  {
    key: "siteContext",
    label: "Site context",
    blurb: "Photos, dimensions, and goals so a builder can quote sight-unseen.",
    facts: [
      {
        id: "photos",
        label: "Photos of current bathroom",
        weight: 2,
        isResolved: (s) => arrHas(s.photos),
      },
      {
        id: "floorPlan",
        label: "Floor plan or dimensions",
        weight: 2,
        isResolved: (s) => arrHas(s.floorPlan),
      },
      {
        id: "goals",
        label: "Project goals",
        weight: 1,
        isResolved: (s) => arrHas(s.goals),
      },
      {
        id: "inspiration",
        label: "Inspiration (link or images)",
        weight: 1,
        isResolved: (s) => arrHas(s.inspirationItems) || has(s.inspirationLink),
      },
      {
        id: "notes",
        label: "Homeowner notes / context",
        weight: 1,
        isResolved: (s) => has(s.notes),
      },
    ],
  },
];

/* ── compute ───────────────────────────────────────────────────── */

export function computeReadiness(s: GroundworkBathroomState): ReadinessReport {
  const dimResults: ReadinessDimensionResult[] = READINESS_GRAPH.map((dim) => {
    let total = 0;
    let resolvedSum = 0;
    const facts: ReadinessFactStatus[] = [];
    for (const f of dim.facts) {
      const relevant = f.relevant ? f.relevant(s) : true;
      const resolved = relevant && f.isResolved(s);
      facts.push({ id: f.id, label: f.label, hint: f.hint, resolved, relevant });
      if (!relevant) continue;
      total += f.weight;
      if (resolved) resolvedSum += f.weight;
    }
    const score = total === 0 ? 100 : Math.round((resolvedSum / total) * 100);
    const relevantFacts = facts.filter((f) => f.relevant);
    const resolvedCount = relevantFacts.filter((f) => f.resolved).length;
    const missing = relevantFacts.filter((f) => !f.resolved).map((f) => f.label);
    return {
      key: dim.key,
      label: dim.label,
      blurb: dim.blurb,
      score,
      total: relevantFacts.length,
      resolved: resolvedCount,
      facts,
      missing,
    };
  });

  // dimension weights for the overall roll-up
  const DIM_WEIGHTS: Record<ReadinessDimensionKey, number> = {
    projectBasics: 0.15,
    scopeDefinition: 0.25,
    structuralClarity: 0.2,
    fixtureSpecs: 0.15,
    finishSelections: 0.15,
    siteContext: 0.1,
  };

  const overall = Math.round(
    dimResults.reduce((sum, d) => sum + d.score * DIM_WEIGHTS[d.key], 0),
  );

  const allMissing = dimResults
    .flatMap((d) =>
      d.facts.filter((f) => f.relevant && !f.resolved),
    );

  const narrative =
    overall >= 90
      ? "This scope is **builder-ready**. Every category is defined; bids you receive will be apples-to-apples. You can proceed to soliciting bids with confidence."
      : overall >= 70
      ? "This scope is **ready for a builder conversation and a sharper feasibility number**. A few finish and fixture decisions are still open — resolving them converts this from a feasibility document into a true apples-to-apples bid package."
      : overall >= 40
      ? "This scope **defines intent but not enough detail for comparable bids**. Several scope, finish, and structural decisions are still open. Builders walking the same space will quote materially different jobs until those resolve."
      : "Early days. Keep going — every answer narrows the bid range and reduces surprise.";

  return { overall, dimensions: dimResults, allMissing, narrative };
}
