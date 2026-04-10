/* ── Low-level converters (pure math — no external dependencies) ── */

const INCHES_PER_METER = 39.3701;
const METERS_PER_INCH = 0.0254;
const SQ_INCHES_PER_SQ_FOOT = 144;
const SQ_FEET_PER_SQ_METER = 10.7639;

export const inchesToMeters = (totalInches: number): number =>
  totalInches * METERS_PER_INCH;

export const metersToInches = (meters: number): number =>
  meters * INCHES_PER_METER;

export const sqInToSqFt = (sqIn: number): number =>
  sqIn / SQ_INCHES_PER_SQ_FOOT;

export const sqMToSqFt = (sqM: number): number =>
  sqM * SQ_FEET_PER_SQ_METER;

/* ── String-level helpers for UI display values ── */

/** Convert feet + inches strings to a display-ready meter string */
export function ftInToMStr(ft: string, inches: string): string {
  const totalIn = (Number(ft) || 0) * 12 + (Number(inches) || 0);
  if (totalIn <= 0) return "";
  const m = inchesToMeters(totalIn);
  return m % 1 === 0 ? m.toString() : parseFloat(m.toFixed(2)).toString();
}

/** Convert a meter string to feet + inches strings */
export function mStrToFtIn(m: string): { ft: string; inches: string } {
  const meters = Number(m) || 0;
  if (meters <= 0) return { ft: "", inches: "" };
  const totalIn = Math.round(metersToInches(meters));
  const ft = Math.floor(totalIn / 12);
  const inches = totalIn % 12;
  return { ft: ft.toString(), inches: inches > 0 ? inches.toString() : "" };
}

/** Compute display area string in the given unit */
export function displayArea(
  main: string,
  mainIn: string,
  main2: string,
  main2In: string,
  unit: "ft" | "m",
): string | null {
  if (unit === "ft") {
    const a = (Number(main) || 0) * 12 + (Number(mainIn) || 0);
    const b = (Number(main2) || 0) * 12 + (Number(main2In) || 0);
    if (!a || !b) return null;
    return `≈ ${Math.round(sqInToSqFt(a * b))} sq ft`;
  }
  const a = Number(main) || 0;
  const b = Number(main2) || 0;
  if (!a || !b) return null;
  return `≈ ${(a * b).toFixed(1)} m²`;
}

/** Compute room area in sq ft regardless of input unit (for budget engine) */
export function toSqFt(
  ft: string,
  inches: string,
  ft2: string,
  inches2: string,
): number | null {
  const a = (Number(ft) || 0) * 12 + (Number(inches) || 0);
  const b = (Number(ft2) || 0) * 12 + (Number(inches2) || 0);
  if (!a || !b) return null;
  return Math.round(sqInToSqFt(a * b));
}
