import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export function WizardProgress({ currentStep, totalSteps, stepLabel }: WizardProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepCount}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        <Text style={styles.stepLabel}>{stepLabel}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  stepCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: "600",
  },
  stepLabel: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
});
