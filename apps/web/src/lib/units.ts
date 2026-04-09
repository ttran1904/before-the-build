// eslint-disable-next-line @typescript-eslint/no-var-requires
const convert = require("convert-units") as (value: number) => { from: (u: string) => { to: (u2: string) => number } };

/* ── Low-level converters (all via convert-units for consistency) ── */
export const inchesToMeters = (totalInches: number): number =>
  convert(totalInches).from("in").to("m");

export const metersToInches = (meters: number): number =>
  convert(meters).from("m").to("in");

export const sqInToSqFt = (sqIn: number): number =>
  convert(sqIn).from("in2").to("ft2");

export const sqMToSqFt = (sqM: number): number =>
  convert(sqM).from("m2").to("ft2");

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
