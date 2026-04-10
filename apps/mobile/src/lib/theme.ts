/** Shared theme constants for mobile — mirrors the web color palette */
export const colors = {
  /** Forest green primary */
  primary: "#2d5a3d",
  primaryLight: "#3d7a53",
  primaryDark: "#1d3a2d",
  /** Warm sand accent */
  accent: "#d4956a",
  accentLight: "#e4b58a",
  /** Sky blue */
  sky: "#87CEEB",
  /** Purple */
  purple: "#d4c5e8",
  /** Neutrals */
  white: "#ffffff",
  background: "#f8f9fa",
  surface: "#ffffff",
  border: "#e2e8f0",
  textPrimary: "#1a1a2e",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  /** Status */
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;
