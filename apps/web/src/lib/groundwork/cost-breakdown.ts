import type { GroundworkBathroomState } from "./store";
import { getRealisticCostRange } from "./store";

export type LineReadiness = "firm" | "estimated" | "rough";

export interface BreakdownLine {
  category: "Materials" | "Labor" | "Permits & Fees";
  item: string;
  description: string;
  low: number;
  high: number;
  readiness: LineReadiness;
}

export interface CostBreakdown {
  lines: BreakdownLine[];
  subtotalLow: number;
  subtotalHigh: number;
  contingencyLow: number;
  contingencyHigh: number;
  totalLow: number;
  totalHigh: number;
  range: { low: number; high: number; label: string };
}

const round = (n: number) => Math.round(n / 50) * 50;

// How tightly we squeeze each line item toward its midpoint.
// 1.0 = original wide spread, 0 = point estimate. Lower = more confident range.
const NARROW_FACTOR = 0.4;

export function getCostBreakdown(s: GroundworkBathroomState): CostBreakdown {
  const range = getRealisticCostRange(s);
  const scale =
    s.bathroomKind === "primary"
      ? 1.4
      : s.bathroomKind === "half_bath"
      ? 0.55
      : s.bathroomKind === "three_quarter"
      ? 0.85
      : 1;

  const lines: BreakdownLine[] = [];

  const add = (
    category: BreakdownLine["category"],
    item: string,
    description: string,
    low: number,
    high: number,
    readiness: LineReadiness = "estimated",
  ) => {
    // Narrow each line band toward its midpoint so the total range feels
    // confident and decision-ready, not a generic web-search spread.
    // (See AGENTS.md "Product Purpose" — a tight, trustworthy range is the product.)
    const mid = (low + high) / 2;
    const narrowedLow = mid - (mid - low) * NARROW_FACTOR;
    const narrowedHigh = mid + (high - mid) * NARROW_FACTOR;
    lines.push({
      category,
      item,
      description,
      low: round(narrowedLow * scale),
      high: round(narrowedHigh * scale),
      readiness,
    });
  };

  // Helper: a line about <field> is "rough" when the underlying choice is open.
  const r = (open: boolean, baseline: LineReadiness = "estimated"): LineReadiness =>
    open ? "rough" : baseline;

  if (s.vanity === "replace" || s.vanity === "relocate" || s.vanity === "unsure") {
    add(
      "Materials",
      "Vanity",
      "New vanity + countertop + sink",
      600,
      2200,
      r(s.vanity === "unsure" || s.vanityStatus !== "selected"),
    );
  }
  if (s.toilet === "replace" || s.toilet === "relocate" || s.toilet === "unsure") {
    add(
      "Materials",
      "Toilet",
      "New toilet + supply line",
      250,
      800,
      r(s.toilet === "unsure" || !s.toiletPlan, "firm"),
    );
  }
  if (s.showerTub === "replace" || s.showerTub === "relocate" || s.showerTub === "unsure") {
    add(
      "Materials",
      "Shower / tub",
      "Pan, surround, valve, trim",
      1200,
      4500,
      r(s.fixtureStatus !== "selected" || s.showerTub === "unsure"),
    );
  }
  if (s.flooring && s.flooring !== "keep") {
    add(
      "Materials",
      "Flooring",
      "Tile, underlayment, grout",
      400,
      1800,
      r(s.tileStatus !== "know"),
    );
  }
  if (s.walls === "new_tile") {
    add(
      "Materials",
      "Wall tile",
      "Tile, mortar, grout, trim",
      600,
      2400,
      r(s.wallTileExtent === "unsure" || !s.wallTileExtent),
    );
  } else if (s.walls === "wallpaper") {
    add("Materials", "Wallpaper", "Wallpaper + adhesive", 200, 800);
  } else if (s.walls === "paint_only") {
    add("Materials", "Paint", "Bath-grade paint + supplies", 80, 250, "firm");
  }
  if (s.lighting && s.lighting !== "keep") {
    add(
      "Materials",
      "Lighting & fixtures",
      "Vanity light, ceiling, exhaust",
      200,
      900,
    );
  }
  if (s.electrical === "new_outlets" || s.electrical === "new_fixtures" || s.electrical === "major") {
    add(
      "Materials",
      "Electrical rough materials",
      "Wire, boxes, GFCI, switches",
      100,
      500,
      "firm",
    );
  }

  add("Labor", "Demolition & disposal", "Tear-out, hauling, dumpster", 400, 1500, "firm");

  const replacingFixture =
    [s.vanity, s.toilet, s.showerTub, s.lighting].filter(
      (x) => x === "replace" || x === "relocate" || x === "unsure",
    ).length > 0;
  if (replacingFixture) {
    add("Labor", "Plumbing labor", "Disconnect, set + connect fixtures", 600, 2400, "estimated");
  }
  const isRelocating = [s.vanity, s.toilet, s.showerTub, s.lighting].some(
    (x) => x === "relocate",
  );
  if (isRelocating) {
    add(
      "Labor",
      "Plumbing relocation",
      "Move supply / drain lines",
      800,
      3500,
      r(s.drainLocation !== "staying"),
    );
  }
  if (s.electrical && s.electrical !== "none") {
    const lo = s.electrical === "major" ? 1200 : 300;
    const hi = s.electrical === "major" ? 4000 : 900;
    add(
      "Labor",
      "Electrical labor",
      "Outlets, fixtures, code work",
      lo,
      hi,
      r(s.electrical === "major"),
    );
  }
  if (s.flooring && s.flooring !== "keep") {
    add("Labor", "Flooring install", "Prep, lay, grout", 400, 1600, r(s.tileStatus !== "know"));
  }
  if (s.walls === "new_tile") {
    add("Labor", "Wall-tile install", "Waterproofing, set, grout", 800, 3000);
  } else if (s.walls === "wallpaper") {
    add("Labor", "Wallpaper install", "Surface prep + hang", 200, 800);
  } else if (s.walls === "paint_only") {
    add("Labor", "Painting", "Prep, prime, two coats", 250, 900, "firm");
  }
  if (s.layout === "wall" || s.layout === "full_layout") {
    add("Labor", "Framing & drywall", "Wall changes + finish", 1200, 5000, "rough");
  }
  if (s.layout === "door") {
    add("Labor", "Door relocation", "Reframe + finish", 500, 1800);
  }
  add(
    "Labor",
    "General labor / PM",
    "Site protection, supervision, finish carpentry",
    600,
    2200,
    "firm",
  );

  const needsPermit =
    s.projectType === "full_gut" ||
    s.projectType === "layout_change" ||
    isRelocating ||
    s.layout === "wall" ||
    s.layout === "full_layout" ||
    s.electrical === "major";
  if (needsPermit) {
    add("Permits & Fees", "Permits & inspection", "City permit + inspections", 150, 750, "firm");
  }

  const subtotalLow = lines.reduce((n, l) => n + l.low, 0);
  const subtotalHigh = lines.reduce((n, l) => n + l.high, 0);
  const contingencyLow = round(subtotalLow * 0.1);
  const contingencyHigh = round(subtotalHigh * 0.1);
  const totalLow = subtotalLow + contingencyLow;
  const totalHigh = subtotalHigh + contingencyHigh;

  return {
    lines,
    subtotalLow,
    subtotalHigh,
    contingencyLow,
    contingencyHigh,
    totalLow,
    totalHigh,
    range,
  };
}

export const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const fmtRange = (lo: number, hi: number) =>
  lo === hi ? fmtUsd(lo) : `${fmtUsd(lo)} – ${fmtUsd(hi)}`;
