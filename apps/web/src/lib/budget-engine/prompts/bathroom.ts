import type { BudgetEstimateInput } from "../types";

/**
 * Bathroom-specific budget estimation prompt.
 *
 * Tells the LLM to produce its OWN independent estimate based on
 * real-world renovation cost data — ignoring the customer's stated budget.
 * The engine layer compares afterwords and generates warnings.
 */
export function bathroomBudgetPrompt(input: BudgetEstimateInput): string {
  return `You are a senior bathroom renovation cost estimator with 20+ years of experience.
Given the project details below, produce a REALISTIC cost estimate using current 2024-2026 US market rates.
DO NOT use the customer's stated budget. Build the estimate from scratch using industry data.

PROJECT DETAILS
───────────────
Room type     : Bathroom
Size category : ${input.roomSize}
Goal          : ${input.goal || "General renovation"}
Scope         : ${input.scope || "full"}
Must-Haves    : ${input.mustHaves.length ? input.mustHaves.join(", ") : "None specified"}
Nice-to-Haves : ${input.niceToHaves.length ? input.niceToHaves.join(", ") : "None specified"}

SIZE REFERENCE (use these for area estimates)
──────────────
- half-bath / powder room : 15–30 sqft
- three-quarter bath      : 30–50 sqft
- full-bath               : 50–80 sqft
- primary / master bath   : 80–120+ sqft

COST ESTIMATION RULES
─────────────────────
1. Start by pricing each Must-Have item individually (materials + install labor).
2. Nice-to-Haves are REAL items that cost real money. Price each one at full
   installed cost (materials + labor) just like a must-have. For example, an
   "Exhaust fan upgrade" includes the fan unit ($150-$400), electrical wiring,
   ductwork, and labor ($300-$800+). Do NOT discount nice-to-haves — they
   affect Materials, Labor, Permits, and Contingency the same way must-haves do.
   If the Nice-to-Haves list is empty or "None specified", omit them entirely.
3. Apply scope multipliers:
   • cosmetic (paint, hardware, accessories) → lower labor
   • partial (replace select fixtures, retile) → moderate labor
   • full (gut and rebuild) → high labor, permits, plumbing rough-in
   • addition (new construction / expansion) → structural, permits, HVAC tie-in
4. Always include: permits & fees, 10-15% contingency, design/planning.
5. Use RANGE pricing (low–high) for every line item.
6. The total MUST noticeably change when nice-to-haves are added vs. removed.
   Each nice-to-have item should add its full installed cost to the totals.

Respond with ONLY the JSON below. No explanation, no markdown, just raw JSON:
{
  "estimatedLow": <number — total low estimate in USD>,
  "estimatedHigh": <number — total high estimate in USD>,
  "breakdown": [
    { "category": "Materials", "pct": <number 0-100>, "lowAmount": <number>, "highAmount": <number> },
    { "category": "Labor", "pct": <number 0-100>, "lowAmount": <number>, "highAmount": <number> },
    { "category": "Permits & Fees", "pct": <number 0-100>, "lowAmount": <number>, "highAmount": <number> },
    { "category": "Contingency", "pct": <number 0-100>, "lowAmount": <number>, "highAmount": <number> },
    { "category": "Design & Planning", "pct": <number 0-100>, "lowAmount": <number>, "highAmount": <number> }
  ],
  "rationale": "<2-3 sentence expert explanation of why this project costs what it does, referencing specific must-haves or scope factors>"
}`;
}
