import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

interface BudgetRangeCardProps {
  label: string;
  low: number;
  high: number;
  mid: number;
  warning?: string | null;
}

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export function BudgetRangeCard({ label, low, high, mid, warning }: BudgetRangeCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.mid}>{fmt(mid)}</Text>
      <Text style={styles.range}>
        {fmt(low)} – {fmt(high)}
      </Text>
      {warning ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  mid: {
    fontSize: fontSize.display,
    fontWeight: "700",
    color: colors.primary,
  },
  range: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  warningBox: {
    marginTop: spacing.md,
    backgroundColor: "#fef3c7",
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  warningText: {
    fontSize: fontSize.xs,
    color: "#92400e",
    textAlign: "center",
  },
});
