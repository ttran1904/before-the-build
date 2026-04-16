/**
 * Tile Calculation Utilities
 *
 * Smart tile estimation based on:
 * - Actual bathroom dimensions (from the Goal step)
 * - Shower/tub dimensions (subtracts or adds to coverage area)
 * - Tile size parsed from product specs
 * - 10% waste factor for cuts/breakage
 */

/* ── Tile dimension parsing ── */

/** Standard tile sizes (width × height in inches) for fallback */
const COMMON_TILE_SIZES: { label: string; widthIn: number; heightIn: number }[] = [
  { label: '12" × 12"', widthIn: 12, heightIn: 12 },
  { label: '12" × 24"', widthIn: 12, heightIn: 24 },
  { label: '6" × 6"', widthIn: 6, heightIn: 6 },
  { label: '4" × 4"', widthIn: 4, heightIn: 4 },
  { label: '3" × 6"', widthIn: 3, heightIn: 6 },
  { label: '24" × 24"', widthIn: 24, heightIn: 24 },
  { label: '18" × 18"', widthIn: 18, heightIn: 18 },
  { label: '6" × 24"', widthIn: 6, heightIn: 24 },
  { label: '2" × 2"', widthIn: 2, heightIn: 2 },
  { label: '1" × 1"', widthIn: 1, heightIn: 1 },
];

export interface TileDimensions {
  widthIn: number;
  heightIn: number;
  label: string;
}

/**
 * Parse tile dimensions from product specs.
 * Looks for keys like "Size", "Tile Size", "Dimensions", "Product Dimensions", etc.
 * Handles formats like: "12 x 24 in", "12" x 24"", "30.5cm x 61cm", "12x24", "305mm × 610mm"
 */
export function parseTileDimensions(specs: Record<string, string>): TileDimensions | null {
  // Keys that typically hold tile size info (case-insensitive search)
  const sizeKeys = [
    "size", "tile size", "dimensions", "product dimensions", "nominal size",
    "actual size", "tile dimensions", "format", "piece size",
    "nominal product length x width", "length x width",
  ];

  let sizeValue: string | null = null;

  // Search for a matching key
  for (const [key, val] of Object.entries(specs)) {
    const k = key.toLowerCase().trim();
    if (sizeKeys.some(sk => k.includes(sk)) || k === "size" || k === "dimensions") {
      sizeValue = val;
      break;
    }
  }

  // Fallback: check ALL spec values for dimension-like patterns
  if (!sizeValue) {
    for (const val of Object.values(specs)) {
      if (/\d+\s*["″]?\s*[x×X]\s*\d+/.test(val) || /\d+\s*(?:in|inch|cm|mm)\s*[x×X]/i.test(val)) {
        sizeValue = val;
        break;
      }
    }
  }

  if (!sizeValue) return null;

  return parseDimensionString(sizeValue);
}

/**
 * Parse a dimension string like "12 x 24 in", "12" × 24"", "30.5cm × 61cm" etc.
 * Returns dimensions in inches.
 */
export function parseDimensionString(raw: string): TileDimensions | null {
  const s = raw.trim();

  // Pattern: two numbers separated by x, ×, X, or by
  // With optional unit suffixes (in, ", ″, cm, mm, inch, inches)
  const patterns = [
    // "12 x 24 in" or "12x24in" or "12 × 24 inches"
    /(\d+(?:\.\d+)?)\s*(?:"|″|in(?:ch(?:es)?)?)?\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(?:"|″|in(?:ch(?:es)?)?)?/i,
    // "12" x 24"" or "12″ × 24″"
    /(\d+(?:\.\d+)?)\s*["″]\s*[x×X]\s*(\d+(?:\.\d+)?)\s*["″]/,
    // "30.5cm x 61cm" or "305mm × 610mm"
    /(\d+(?:\.\d+)?)\s*(cm|mm)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(cm|mm)/i,
  ];

  for (const pattern of patterns) {
    const match = s.match(pattern);
    if (match) {
      // Check if it's metric
      if (match[2] && /^(cm|mm)$/i.test(match[2])) {
        const unit = match[2].toLowerCase();
        const w = parseFloat(match[1]);
        const h = parseFloat(match[3]);
        const factor = unit === "cm" ? 1 / 2.54 : 1 / 25.4;
        const widthIn = Math.round(w * factor * 100) / 100;
        const heightIn = Math.round(h * factor * 100) / 100;
        return {
          widthIn,
          heightIn,
          label: `${match[1]}${unit} × ${match[3]}${unit} (≈${widthIn.toFixed(1)}" × ${heightIn.toFixed(1)}")`,
        };
      }

      // Imperial (inches)
      const widthIn = parseFloat(match[1]);
      const heightIn = parseFloat(match[2]);
      if (widthIn > 0 && heightIn > 0) {
        return {
          widthIn,
          heightIn,
          label: `${widthIn}" × ${heightIn}"`,
        };
      }
    }
  }

  return null;
}

/* ── Area calculations ── */

/** Default shower wall height in inches (8 ft from floor) */
const DEFAULT_SHOWER_WALL_HEIGHT_IN = 96;

/** Waste factor — accounts for cuts, breakage, and pattern matching */
const WASTE_FACTOR = 0.10;

export interface TileAreaResult {
  /** Gross area before subtractions (sq ft) */
  grossSqft: number;
  /** Net area to tile after subtractions (sq ft) */
  netSqft: number;
  /** Tile coverage per piece (sq ft) */
  tileSqft: number;
  /** Number of tiles needed (with waste factor) */
  quantity: number;
  /** The waste factor applied (e.g. 0.10) */
  wasteFactor: number;
  /** Human-readable breakdown */
  breakdown: string;
}

export interface FloorTileInput {
  /** Room width in total inches */
  roomWidthIn: number;
  /** Room length in total inches */
  roomLengthIn: number;
  /** Whether a bathtub is present (subtracts ~9 sq ft footprint) */
  hasBathtub: boolean;
  /** Optional bathtub footprint override (sq inches). Default: standard 60"×30" = 1800 sq in */
  bathtubSqIn?: number;
  /** Whether a walk-in shower is present (shower floor still needs tiles!) */
  hasWalkInShower: boolean;
}

/**
 * Calculate floor tile area and quantity.
 *
 * Floor area = roomWidth × roomLength
 * Subtract: bathtub footprint (if present, standard 60" × 30" = 12.5 sq ft)
 * Note: walk-in showers STILL need floor tiles, so no subtraction.
 * Vanity/toilet footprints are negligible and usually tiled under.
 */
export function calcFloorTileArea(
  input: FloorTileInput,
  tile: TileDimensions,
): TileAreaResult {
  const grossSqIn = input.roomWidthIn * input.roomLengthIn;
  let subtractSqIn = 0;

  let breakdown = `Room floor: ${fmtSqft(grossSqIn)} sq ft`;

  if (input.hasBathtub) {
    // Standard bathtub footprint: 60" × 30" = 1,800 sq in = 12.5 sq ft
    const bathtubArea = input.bathtubSqIn ?? 1800;
    subtractSqIn += bathtubArea;
    breakdown += ` − Bathtub footprint: ${fmtSqft(bathtubArea)} sq ft`;
  }

  const netSqIn = Math.max(0, grossSqIn - subtractSqIn);
  const tileSqIn = tile.widthIn * tile.heightIn;
  const netSqft = netSqIn / 144;
  const tileSqft = tileSqIn / 144;

  // Tiles needed = (area / tile area) × (1 + waste)
  const rawCount = netSqIn / tileSqIn;
  const quantity = Math.ceil(rawCount * (1 + WASTE_FACTOR));

  breakdown += ` = ${fmtSqft(netSqIn)} sq ft net`;
  breakdown += ` · Tile: ${tile.label} (${tileSqft.toFixed(2)} sq ft each)`;
  breakdown += ` · ${quantity} tiles (incl. ${Math.round(WASTE_FACTOR * 100)}% waste)`;

  return {
    grossSqft: grossSqIn / 144,
    netSqft,
    tileSqft,
    quantity,
    wasteFactor: WASTE_FACTOR,
    breakdown,
  };
}

export interface WallTileInput {
  /** Shower width in total inches */
  showerWidthIn: number;
  /** Shower length/depth in total inches */
  showerLengthIn: number;
  /** Wall height to tile in inches (default: 96" = 8 ft) */
  wallHeightIn?: number;
  /** Number of walls to tile (default: 3 for standard alcove shower) */
  numWalls?: number;
}

/**
 * Calculate shower wall tile area and quantity.
 *
 * For a standard alcove shower (3 walls):
 *   Area = (back wall + 2 side walls) × height
 *         = (showerWidth + 2 × showerLength) × wallHeight
 *
 * Subtracts: ~6 sq ft for showerhead/valve cutout area (negligible but accounted for)
 */
export function calcWallTileArea(
  input: WallTileInput,
  tile: TileDimensions,
): TileAreaResult {
  const wallH = input.wallHeightIn ?? DEFAULT_SHOWER_WALL_HEIGHT_IN;
  const numWalls = input.numWalls ?? 3;

  // Standard 3-wall calculation: back + 2 sides
  let perimeterIn: number;
  if (numWalls === 3) {
    perimeterIn = input.showerWidthIn + 2 * input.showerLengthIn;
  } else {
    // For walk-in or open showers, approximate
    perimeterIn = input.showerWidthIn * numWalls;
  }

  const grossSqIn = perimeterIn * wallH;

  // Subtract ~6 sq ft (864 sq in) for fixtures/openings
  const fixtureCutout = 864;
  const netSqIn = Math.max(0, grossSqIn - fixtureCutout);

  const tileSqIn = tile.widthIn * tile.heightIn;
  const netSqft = netSqIn / 144;
  const tileSqft = tileSqIn / 144;

  const rawCount = netSqIn / tileSqIn;
  const quantity = Math.ceil(rawCount * (1 + WASTE_FACTOR));

  let breakdown = `Shower walls: ${numWalls} walls × ${(wallH / 12).toFixed(1)} ft height`;
  breakdown += ` = ${fmtSqft(grossSqIn)} sq ft gross`;
  breakdown += ` − ~6 sq ft fixtures = ${fmtSqft(netSqIn)} sq ft net`;
  breakdown += ` · Tile: ${tile.label} (${tileSqft.toFixed(2)} sq ft each)`;
  breakdown += ` · ${quantity} tiles (incl. ${Math.round(WASTE_FACTOR * 100)}% waste)`;

  return {
    grossSqft: grossSqIn / 144,
    netSqft,
    tileSqft,
    quantity,
    wasteFactor: WASTE_FACTOR,
    breakdown,
  };
}

/* ── Helpers ── */

function fmtSqft(sqIn: number): string {
  return (sqIn / 144).toFixed(1);
}

/** Default tile sizes to use when product specs don't include dimensions */
export const DEFAULT_FLOOR_TILE: TileDimensions = { widthIn: 12, heightIn: 12, label: '12" × 12"' };
export const DEFAULT_WALL_TILE: TileDimensions = { widthIn: 3, heightIn: 6, label: '3" × 6" (subway)' };

/** Labor cost per sq ft for tile installation (material-independent) */
export const TILE_LABOR_PER_SQFT = 12;
