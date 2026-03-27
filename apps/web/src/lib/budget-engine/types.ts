/**
 * Budget Engine — Shared Types
 *
 * Used by prompts, engines, and API routes.
 * Room-agnostic so the same types work for bathroom, kitchen, etc.
 */

export interface BudgetEstimateInput {
  roomType: string;
  goal: string;
  scope: string;
  mustHaves: string[];
  niceToHaves: string[];
  roomSize: string;
  /** The customer's self-reported budget (may be inaccurate). */
  customerBudget: number | null;
}

export interface BreakdownLineItem {
  category: string;
  /** Percentage of total (0–100) */
  pct: number;
  /** Dollar low end of the range */
  lowAmount: number;
  /** Dollar high end of the range */
  highAmount: number;
}

export interface BudgetEstimateResult {
  /** Engine-calculated budget range — independent of the customer's input */
  estimatedLow: number;
  estimatedHigh: number;
  /** Line-item breakdown (Materials, Labor, etc.) */
  breakdown: BreakdownLineItem[];
  /** Warning message if the customer's budget falls below our estimated range */
  budgetWarning: string | null;
  /** Short expert rationale for this estimate (2-3 sentences) */
  rationale: string;
}
