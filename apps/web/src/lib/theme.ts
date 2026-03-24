/**
 * Before The Build — Design Tokens / Theme Constants
 *
 * Single source of truth for all brand colors used across the app.
 * Import from "@/lib/theme" instead of hardcoding hex values.
 */

export const theme = {
  /* ── Brand Colors ── */
  primary: "#2d5a3d",       // Forest green — buttons, active states, headings
  primaryHover: "#234a31",  // Darker green — hover states
  primaryLight: "rgba(45, 90, 61, 0.05)",  // Green tint — selected card backgrounds
  primaryBadge: "rgba(45, 90, 61, 0.1)",   // Green tint — badges, chips

  /* ── Neutrals ── */
  text: "#1a1a2e",          // Headings, primary text
  textSecondary: "#4a4a5a", // Body text, descriptions
  textMuted: "#6a6a7a",     // Secondary labels, captions
  textDisabled: "#9a9aaa",  // Disabled, placeholder

  /* ── Backgrounds ── */
  bg: "#f8f7f4",            // Page background (warm off-white)
  bgCard: "#ffffff",        // Card / panel backgrounds
  bgSubtle: "#f3f2ef",      // Subtle backgrounds, hover states

  /* ── Borders ── */
  border: "#e8e6e1",        // Default borders
  borderHover: "#d5d3cd",   // Hover borders

  /* ── Accents ── */
  accent: "#d4956a",        // Warm orange — nice-to-haves, warnings
  accentBlue: "#87CEEB",    // Sky blue — info, in-progress
  accentPurple: "#d4c5e8",  // Soft purple — installations

  /* ── Status ── */
  success: "#2d5a3d",       // Same as primary
  error: "#dc3545",
  warning: "#d4956a",
} as const;
