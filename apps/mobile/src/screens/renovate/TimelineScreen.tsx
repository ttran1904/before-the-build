import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BathroomWizardParamList } from "../../navigation/BathroomWizardNavigator";
import { WizardProgress } from "../../components/WizardProgress";
import { Chip } from "../../components/Chip";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "Timeline">;

type ViewMode = "board" | "list";

const PHASES = [
  { name: "Planning", color: "#3b82f6", weeks: "1-2" },
  { name: "Demolition", color: "#ef4444", weeks: "3" },
  { name: "Rough-in", color: "#f59e0b", weeks: "4-5" },
  { name: "Installation", color: "#22c55e", weeks: "6-8" },
  { name: "Finishing", color: "#8b5cf6", weeks: "9-10" },
];

export default function TimelineScreen({ navigation }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={7} totalSteps={10} stepLabel="Timeline" />

      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <Chip
          label="Board"
          selected={viewMode === "board"}
          onPress={() => setViewMode("board")}
        />
        <Chip
          label="List"
          selected={viewMode === "list"}
          onPress={() => setViewMode("list")}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Project Timeline</Text>
        <Text style={styles.subheading}>
          AI-generated timeline based on your scope and selected items.
          Phases are color-coded with estimated durations.
        </Text>

        {/* Phase cards */}
        {PHASES.map((phase) => (
          <View key={phase.name} style={styles.phaseCard}>
            <View style={[styles.phaseIndicator, { backgroundColor: phase.color }]} />
            <View style={styles.phaseContent}>
              <Text style={styles.phaseName}>{phase.name}</Text>
              <Text style={styles.phaseWeeks}>Weeks {phase.weeks}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </View>
        ))}

        {/* Placeholder for generated tasks */}
        <View style={styles.infoBox}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Detailed tasks with dependencies will be generated when you connect
            to the AI service. Tasks can be synced to Asana or exported.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("Contractor")}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toggleRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  phaseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phaseIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  phaseContent: { flex: 1 },
  phaseName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  phaseWeeks: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: "#f0f7f2",
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  nextBtnText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
