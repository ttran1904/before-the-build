import type { GroundworkBathroomState } from "./store";
import { projectTypeLabel } from "./store";
import { getCostBreakdown } from "./cost-breakdown";
import { computeReadiness, type ReadinessReport } from "./readiness-graph";

/* ──────────────────────────────────────────────────────────────────
 * Ground Report deriver
 * Turns the wizard state into the formal "Ground Report" sections:
 *   - Scope of Work        (DEFINED / ASSUMED / EXCLUDED)
 *   - Budget Sensitivity   (low / mid / high spec tiers)
 *   - Assumption Log       (A1, A2, … with impact + driver phrase)
 *   - Open Items           (selection-required + confirm-before-X)
 *   - Responsibility Matrix (supplied-by / installed-by / timing)
 *   - Readiness Summary    (% per category + narrative)
 *
 * Everything is data-driven from store state where possible.
 * ────────────────────────────────────────────────────────────────── */

export type ScopeStatus = "DEFINED" | "ASSUMED" | "EXCLUDED";
export type Impact = "Low" | "Mid" | "High";

export interface ScopeOfWorkRow {
  item: string;
  asDefined: string;
  status: ScopeStatus;
  note: string;
}

export interface AssumptionRow {
  id: string;          // A1, A2, …
  text: string;        // full sentence
  highlight: string;   // phrase to render in accent color
  impact: Impact;
}

export interface OpenItemCard {
  category: "SELECTION REQUIRED" | "CONFIRM BEFORE SIGNING" | "CONFIRM BEFORE ROUGH-IN" | "CONFIRM BEFORE FRAMING";
  title: string;
  body: string;
}

export interface ResponsibilityRow {
  item: string;
  suppliedBy: "OWNER" | "BUILDER";
  installedBy: "OWNER" | "BUILDER";
  timing: string;
}

export interface BudgetTier {
  label: "LOW-END ESTIMATE" | "MID-RANGE ESTIMATE" | "HIGH-END ESTIMATE";
  amount: string;
  blurb: string;
  emphasis?: boolean;
}

export interface ReadinessScores {
  scopeDefinition: number;
  finishSelections: number;
  structuralClarity: number;
  fixtureSpecs: number;
  overall: number;
  narrative: string;
}

export interface ReportMeta {
  title: string;
  homeowner: string;
  property: string;
  reportPeriod: string;
  reportId: string;
  bidReadiness: number;
  version: string;
}

/* ── Scope of Work ─────────────────────────────────────────────── */

export function getScopeOfWork(s: GroundworkBathroomState): ScopeOfWorkRow[] {
  const rows: ScopeOfWorkRow[] = [];

  // Demo & removal
  const demoText =
    s.demo === "full_gut"
      ? "Full tile demo to substrate. Existing vanity, toilet, and fixtures removed and hauled. Drywall replacement limited to shower wet zone only; any drywall damage in dry areas patched but not replaced unless structurally required. Backer board installation included in shower wet zone. Minor subfloor leveling included; significant leveling or joist repair is a separate line. No patch or paint in adjacent hallway, closet, or bedroom unless damage is caused by builder during work."
      : s.demo === "standard"
      ? "Selective demo of fixtures and finishes being replaced. Existing substrate retained where sound. Haul-away included."
      : s.demo === "cosmetic"
      ? "Cosmetic-level removal only — no substrate or rough-in disturbed."
      : "Demo extent to be confirmed with builder before bid.";
  rows.push({
    item: "Demo & Removal",
    asDefined: demoText,
    status: s.demo && s.demo !== "unsure" ? "DEFINED" : "ASSUMED",
    note: "Scope boundary set",
  });

  // Shower
  if (s.showerInScope === "yes" || s.showerTub === "replace" || s.showerTub === "relocate") {
    const dim =
      s.showerWidth && s.showerDepth
        ? `${s.showerWidth}" × ${s.showerDepth}"`
        : s.showerSize === "small"
        ? "Compact (≤32×60)"
        : s.showerSize === "medium"
        ? "Standard (~36×60)"
        : s.showerSize === "large"
        ? "Oversized (>36×60)"
        : "Size TBD";
    const style =
      s.showerUpdate === "walkin_curbless"
        ? "Walk-in, curbless"
        : s.showerUpdate === "walkin_curbed"
        ? "Walk-in, curbed"
        : s.showerUpdate === "tub_to_shower"
        ? "Tub-to-shower conversion"
        : s.showerUpdate === "tub_surround"
        ? "Tub + surround"
        : "Style TBD";
    const tile =
      s.tileHeight === "ceiling" ? "Tile surround to ceiling." : s.tileHeight === "partway" ? "Tile surround partway up wall." : "Tile height TBD.";
    const niche = s.showerFeatures?.includes("niche") ? " Niche on back wall." : "";
    rows.push({
      item: "Shower",
      asDefined: `${style}. ${dim}. ${tile}${niche}`,
      status: s.showerSize && s.showerSize !== "unsure" ? "DEFINED" : "ASSUMED",
      note: s.showerSize === "known" ? "Size confirmed" : "Confirm dims",
    });
  }

  // Shower fixtures
  if (s.fixtureSetup) {
    const setup =
      s.fixtureSetup === "rain_hand"
        ? "Rainfall head + hand shower."
        : s.fixtureSetup === "full_system"
        ? "Full fixture system (rain + hand + body)."
        : s.fixtureSetup === "standard"
        ? "Standard single-head fixture."
        : "Fixture setup TBD.";
    const brand = s.fixtureBrand ? `Brand/model: ${s.fixtureBrand}.` : "Brand/model: Owner's selection pending.";
    rows.push({
      item: "Shower Fixtures",
      asDefined: `${setup} ${brand}`,
      status: s.fixtureStatus === "selected" ? "DEFINED" : "ASSUMED",
      note: "Price varies widely",
    });
  }

  // Flooring
  if (s.flooring && s.flooring !== "keep") {
    const look =
      s.tileLook === "large"
        ? "12×24 or larger format"
        : s.tileLook === "medium"
        ? "Mid-format tile"
        : s.tileLook === "small"
        ? "Small-format / mosaic"
        : s.tileLook === "patterned"
        ? "Patterned tile"
        : "Format TBD";
    const pattern = s.tileDirectionText ? ` Pattern: ${s.tileDirectionText}.` : "";
    const wallExtent =
      s.wallTileExtent === "shower_only"
        ? "Wall tile in shower only."
        : s.wallTileExtent === "shower_vanity"
        ? "Wall tile in shower + vanity wall."
        : s.wallTileExtent === "most_partway"
        ? "Wall tile most walls, partway up."
        : s.wallTileExtent === "most_full"
        ? "Wall tile most walls, full height."
        : "Wall tile extent TBD.";
    rows.push({
      item: "Flooring",
      asDefined: `Tile throughout. ${look}.${pattern} ${wallExtent} Builder to price labor based on 12×24 format; any change to mosaic or format under 4×4 is a labor change order. **Default bidding assumption:** wall tile extends to 48" height on vanity wall and to full height inside shower surround only. Any wall tile beyond this assumption requires owner confirmation prior to bid.`,
      status: s.tileStatus === "know" ? "DEFINED" : "ASSUMED",
      note: "Format drives labor",
    });
  }

  // Vanity
  if (s.vanity && s.vanity !== "keep") {
    const plan =
      s.vanityPlan === "single"
        ? `Single ${s.vanityWidth || "36"}" freestanding`
        : s.vanityPlan === "double"
        ? `Double-sink, ${s.vanityWidth || "60"}"`
        : s.vanityPlan === "pedestal"
        ? "Pedestal sink"
        : "Vanity TBD";
    rows.push({
      item: "Vanity",
      asDefined: `${plan}. Owner-supplied. Plumbing rough-in included.`,
      status: s.vanityStatus === "selected" ? "DEFINED" : "ASSUMED",
      note: "Owner-supply",
    });
  }

  // Lighting
  if (s.lighting && s.lighting !== "keep") {
    rows.push({
      item: "Lighting",
      asDefined: `Vanity bar light. Owner-supplied fixture. Recessed in shower.`,
      status: "DEFINED",
      note: "—",
    });
  }

  // Toilet
  if (s.toilet) {
    const t =
      s.toiletPlan === "keep"
        ? "Toilet replacement excluded. Existing unit retained. Builder to include temporary removal and reset of existing toilet to accommodate floor tile installation as a **line item in bid**. Cost not included in base scope estimate."
        : s.toiletPlan === "owner_supplied"
        ? "New toilet, owner-supplied. Builder install. Supply line included."
        : s.toiletPlan === "builder_supplied"
        ? "New toilet, builder-supplied at standard spec."
        : "Toilet plan TBD.";
    rows.push({
      item: "Toilet",
      asDefined: t,
      status: s.toiletPlan && s.toiletPlan !== "unsure" ? "DEFINED" : "ASSUMED",
      note: s.toiletPlan === "keep" ? "Line-item in bid" : "—",
    });
  }

  // Paint
  if (s.paint === "yes" || s.walls === "paint_only") {
    rows.push({
      item: "Paint",
      asDefined:
        "Ceiling and walls. Color TBD. Two coats. Prep standard: basic only — clean, prime, paint. No skim coat, float coat, or cosmetic wall correction included unless damage is builder-caused during construction.",
      status: "DEFINED",
      note: "—",
    });
  }

  // Waterproofing (always for shower replacements)
  if (s.showerInScope === "yes" || s.showerTub === "replace") {
    rows.push({
      item: "Waterproofing",
      asDefined:
        "Shower surround and pan waterproofed to current code. Schluter or equivalent membrane system. Method at builder's discretion unless otherwise specified.",
      status: "DEFINED",
      note: "Standard included",
    });
  }

  // Shower glass enclosure
  if (s.showerGlass) {
    const glass =
      s.showerGlass === "include"
        ? { def: "Frameless glass enclosure included in scope. Spec TBD by owner.", st: "DEFINED" as ScopeStatus, n: "In scope" }
        : s.showerGlass === "later"
        ? {
            def: "Not included in this scope. Owner to contract separately or add as change order after bid. Blocking for future frameless door installation: included in framing scope. No pre-wiring associated with glass enclosure.",
            st: "EXCLUDED" as ScopeStatus,
            n: "Confirm w/ builder",
          }
        : { def: "Shower glass enclosure deferred. Decision pending.", st: "ASSUMED" as ScopeStatus, n: "Open" };
    rows.push({ item: "Shower Glass Enclosure", asDefined: glass.def, status: glass.st, note: glass.n });
  }

  // Electrical
  if (s.electrical && s.electrical !== "none") {
    const isMajor = s.electrical === "major";
    rows.push({
      item: "Electrical",
      asDefined: isMajor
        ? "Major electrical work in scope. Includes new circuits and panel coordination as required by inspection."
        : "Scope limited to: vanity bar light (1 circuit), recessed shower light (1 fixture), GFCI devices to code minimum. Explicitly excluded: panel upgrades, heated floor wiring, exhaust fan swap or new duct run, switching changes outside the immediate bath, device replacement in adjacent spaces, and patch/repair of electrical outside the scope boundary.",
      status: "DEFINED",
      note: "Boundary set",
    });
  }

  // Accessories & trim
  if (s.accessories) {
    rows.push({
      item: "Accessories & Trim",
      asDefined:
        s.accessories === "self"
          ? "Towel bars, toilet paper holder, robe hooks, and mirror excluded. Owner-supplied and owner-installed. Blocking in walls for future mounting: included."
          : "Towel bars, TP holder, robe hooks, mirror — owner-supplied, builder-installed. Blocking included.",
      status: s.accessories === "self" ? "EXCLUDED" : "DEFINED",
      note: "Blocking included",
    });
  }

  // Permits
  rows.push({
    item: "Permits",
    asDefined:
      "Builder responsible for pulling all required permits. Permit fees to be itemized as a separate line in bid. Not included in labor estimate.",
    status: "DEFINED",
    note: "Builder responsibility",
  });

  return rows;
}

/* ── Assumption Log ────────────────────────────────────────────── */

export function getAssumptionLog(s: GroundworkBathroomState): AssumptionRow[] {
  const out: AssumptionRow[] = [];
  let n = 1;
  const push = (text: string, highlight: string, impact: Impact) => {
    out.push({ id: `A${n++}`, text, highlight, impact });
  };

  push(
    "Subfloor is in good condition. If damaged, expect $800–$2,400 in additional cost depending on extent of rot or soft spots.",
    "If damaged",
    "High",
  );

  if (s.showerFloorTile === "same" || !s.showerFloorTile) {
    push(
      "Shower floor tile is same material as field tile. If a separate mosaic is chosen, labor and material cost increase.",
      "same material",
      "Mid",
    );
  }

  if (s.plumbing === "staying" || s.drainLocation === "staying") {
    push(
      "No relocation of existing plumbing. Curbless shower drain will be tied to existing drain location.",
      "tied to existing drain location",
      "High",
    );
  }

  if (
    !s.electricalFan?.length ||
    s.electricalFan.includes("simple_swap") ||
    s.electricalFan.includes("none")
  ) {
    push(
      "Existing ventilation fan is adequate. No new duct run required. Code compliance assumed by builder.",
      "adequate",
      "Low",
    );
  }

  if (s.showerFeatures?.includes("niche")) {
    push(
      "Shower niche is single, centered, between studs. Any niche requiring structural framing will add cost.",
      "single, centered",
      "Mid",
    );
  }

  if (s.showerUpdate === "walkin_curbless") {
    push(
      "Curbless shower conversion requires no structural framing changes to floor joists. If floor system must be modified to accommodate drain slope, structural costs apply.",
      "no structural framing changes",
      "High",
    );
  }

  if (s.vanityStatus === "selected" || s.vanityWidth) {
    push(
      `Owner-supplied vanity is dimensionally confirmed prior to rough-in. Plumbing rough-in will be set to ${
        s.vanityWidth || "36"
      }" unit. Any post-rough-in change to vanity size is a change order.`,
      "dimensionally confirmed",
      "Mid",
    );
  }

  return out;
}

/* ── Open Items ────────────────────────────────────────────────── */

export function getOpenItemCards(s: GroundworkBathroomState): OpenItemCard[] {
  const cards: OpenItemCard[] = [];

  if (s.tileStatus !== "know" || !s.tileLook || s.tileLook === "unsure") {
    cards.push({
      category: "SELECTION REQUIRED",
      title: "Floor & Wall Tile Spec",
      body:
        "Tile size, wall tile extent beyond shower, edge treatment, trim profile, and grout type all unresolved. Labor is priced assuming 12×24 format. A mosaic or small-format tile is a labor change order. These decisions must precede final bid.",
    });
  }

  if (s.fixtureStatus !== "selected") {
    cards.push({
      category: "SELECTION REQUIRED",
      title: "Shower Fixtures",
      body:
        "Rainfall and hand shower brand and model unspecified. Price range is $300–$4,200 depending on brand. Spec this before bidding.",
    });
  }

  if (s.drainLocation === "unsure" || s.drainLocation === "moving") {
    cards.push({
      category: "CONFIRM BEFORE SIGNING",
      title: "Drain Location",
      body:
        "Curbless conversion requires confirmed drain position relative to existing rough-in. Any relocation changes structural scope and cost materially.",
    });
  }

  if (s.vanitySize !== "known") {
    cards.push({
      category: "CONFIRM BEFORE ROUGH-IN",
      title: "Vanity Dimensions",
      body: `Plumbing rough-in will be set to the ${
        s.vanityWidth || "36"
      }" unit. Owner must confirm final vanity selection before rough-in begins. A post-rough-in change is a change order.`,
    });
  }

  if (s.showerGlass === "later" || s.showerGlass === "open") {
    cards.push({
      category: "CONFIRM BEFORE FRAMING",
      title: "Shower Glass Blocking",
      body:
        "Glass enclosure is excluded from scope. Blocking for a future frameless door is included in framing. Confirm blocking placement with builder before walls close — this cannot be added after the fact.",
    });
  }

  return cards;
}

/* ── Responsibility Matrix ─────────────────────────────────────── */

export function getResponsibilityMatrix(s: GroundworkBathroomState): ResponsibilityRow[] {
  const rows: ResponsibilityRow[] = [];

  if (s.vanity && s.vanity !== "keep") {
    rows.push({ item: "Vanity", suppliedBy: "OWNER", installedBy: "BUILDER", timing: "Must arrive before plumbing set" });
    rows.push({ item: "Vanity Faucet", suppliedBy: "OWNER", installedBy: "BUILDER", timing: "Confirm faucet holes match vanity" });
  }
  if (s.lighting && s.lighting !== "keep") {
    rows.push({ item: "Vanity Light Fixture", suppliedBy: "OWNER", installedBy: "BUILDER", timing: "Must arrive before electrical finish" });
  }
  if (s.fixtureSetup) {
    rows.push({ item: "Shower Fixtures", suppliedBy: "OWNER", installedBy: "BUILDER", timing: "Spec required before rough-in" });
  }
  if (s.flooring && s.flooring !== "keep") {
    rows.push({ item: "Floor & Wall Tile", suppliedBy: "OWNER", installedBy: "BUILDER", timing: "10% overage required on site" });
  }
  if (s.accessories === "self") {
    rows.push({ item: "Accessories & Mirror", suppliedBy: "OWNER", installedBy: "OWNER", timing: "After punch-out; blocking by builder" });
  } else if (s.accessories === "builder") {
    rows.push({ item: "Accessories & Mirror", suppliedBy: "OWNER", installedBy: "BUILDER", timing: "Delivered before punch-out" });
  }
  if (s.toilet && s.toilet !== "keep") {
    rows.push({
      item: "Toilet",
      suppliedBy: s.toiletPlan === "builder_supplied" ? "BUILDER" : "OWNER",
      installedBy: "BUILDER",
      timing: "After tile complete",
    });
  }
  rows.push({ item: "Permits", suppliedBy: "BUILDER", installedBy: "BUILDER", timing: "Line-itemized in bid" });

  return rows;
}

/* ── Budget Sensitivity Range ──────────────────────────────────── */

export function getBudgetSensitivity(s: GroundworkBathroomState): {
  tiers: BudgetTier[];
  whyWide: string;
} {
  const b = getCostBreakdown(s);
  const lo = Math.round(b.totalLow / 100) * 100;
  const hi = Math.round(b.totalHigh / 100) * 100;
  const mid = Math.round((lo + hi) / 2 / 100) * 100;

  const tiers: BudgetTier[] = [
    {
      label: "LOW-END ESTIMATE",
      amount: `$${lo.toLocaleString()}`,
      blurb: "Builder-grade finishes. Standard labor. No structural changes.",
    },
    {
      label: "MID-RANGE ESTIMATE",
      amount: `$${mid.toLocaleString()}`,
      blurb: "Mid-spec tile, semi-custom fixtures. Assumed scope as defined.",
      emphasis: true,
    },
    {
      label: "HIGH-END ESTIMATE",
      amount: `$${hi.toLocaleString()}+`,
      blurb: "Designer tile, high-spec fixtures. Discovery of any subfloor issues.",
    },
  ];

  const openCount = getOpenItemCards(s).filter((c) => c.category === "SELECTION REQUIRED").length;
  const whyWide =
    openCount >= 2
      ? "Two scope items remain unspecified — shower fixtures and floor tile material. Together, these two selections carry $6,000–$14,000 in potential variance. Resolving them before soliciting bids is strongly recommended."
      : openCount === 1
      ? "One finish selection remains open and is the largest source of variance in this range. Resolving it before bid will narrow the band by ~30%."
      : "Range is driven primarily by spec tier (builder-grade vs. designer) and behind-wall discovery. Both narrow once a builder walks the space.";

  return { tiers, whyWide };
}

/* ── Readiness Summary ─────────────────────────────────────────── */

export function getReadinessScores(s: GroundworkBathroomState): ReadinessScores {
  const r = computeReadiness(s);
  const dim = (key: string) =>
    r.dimensions.find((d) => d.key === key)?.score ?? 0;
  return {
    scopeDefinition: dim("scopeDefinition"),
    finishSelections: dim("finishSelections"),
    structuralClarity: dim("structuralClarity"),
    fixtureSpecs: dim("fixtureSpecs"),
    overall: r.overall,
    narrative: r.narrative,
  };
}

/** Full knowledge-graph readiness — the report tab uses this directly to
 *  show per-dimension breakdowns and lists of unresolved questions. */
export function getReadinessReport(s: GroundworkBathroomState): ReadinessReport {
  return computeReadiness(s);
}

/* ── Report Meta ───────────────────────────────────────────────── */

export function getReportMeta(s: GroundworkBathroomState): ReportMeta {
  const r = getReadinessScores(s);
  const kind =
    s.bathroomKind === "primary"
      ? "Primary Bath"
      : s.bathroomKind === "half_bath"
      ? "Half Bath"
      : s.bathroomKind === "three_quarter"
      ? "3/4 Bath"
      : s.bathroomKind === "full_bath"
      ? "Full Bath"
      : "Bathroom";
  const action = projectTypeLabel(s.projectType);
  const title = `${kind} ${action === "Not yet selected" ? "Renovation" : action}`;

  const now = new Date();
  const datePretty = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePretty = now.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;

  return {
    title,
    homeowner: "Homeowner",
    property: "Property on file",
    reportPeriod: `${datePretty} · ${timePretty}`,
    reportId: `GR-${stamp}`,
    bidReadiness: r.overall,
    version: "Ground Report v1",
  };
}
