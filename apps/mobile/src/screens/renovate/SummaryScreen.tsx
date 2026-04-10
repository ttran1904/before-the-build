import React, { useMemo } from "react";
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
import { useWizardStore } from "../../lib/store";
import { computeBudgetGraph } from "@before-the-build/shared";
import { WizardProgress } from "../../components/WizardProgress";
import { BudgetRangeCard } from "../../components/BudgetRangeCard";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "Summary">;

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function SummaryScreen({ navigation }: Props) {
  const store = useWizardStore();

  const graph = useMemo(
    () =>
      computeBudgetGraph({
        roomSize: store.bathroomSize,
        scope: store.scope,
        mustHaves: store.mustHaves,
        niceToHaves: store.niceToHaves,
        includeNiceToHaves: true,
        customerBudget: store.budgetAmount,
        priceOverrides: store.priceOverrides,
      }),
    [
      store.bathroomSize,
      store.scope,
      store.mustHaves,
      store.niceToHaves,
      store.budgetAmount,
      store.priceOverrides,
    ],
  );

  const scopeLabel =
    store.scope === "cosmetic"
      ? "Cosmetic Refresh"
      : store.scope === "partial"
        ? "Partial Remodel"
        : store.scope === "addition"
          ? "Addition"
          : "Full Remodel";

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={9} totalSteps={10} stepLabel="Summary" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Project Summary</Text>

        {/* Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Room</Text>
            <Text style={styles.overviewValue}>
              {store.bathroomSize.replace(/-/g, " ")}
            </Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Scope</Text>
            <Text style={styles.overviewValue}>{scopeLabel}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Goals</Text>
            <Text style={styles.overviewValue}>{store.goals.length} selected</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Must-Haves</Text>
            <Text style={styles.overviewValue}>{store.mustHaves.length} items</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Nice-to-Haves</Text>
            <Text style={styles.overviewValue}>{store.niceToHaves.length} items</Text>
          </View>
        </View>

        {/* Budget estimate */}
        <View style={{ marginTop: spacing.lg }}>
          <BudgetRangeCard
            label="Estimated Total Cost"
            low={graph.estimatedLow}
            high={graph.estimatedHigh}
            mid={graph.estimatedMid}
            warning={graph.budgetWarning}
          />
        </View>

        {/* Item breakdown */}
        <Text style={[styles.heading, { marginTop: spacing.xl }]}>
          Item Breakdown
        </Text>
        {graph.itemBreakdown.map((item) => (
          <View key={item.label} style={styles.itemRow}>
            <Ionicons
              name={item.source === "must-have" ? "checkmark-circle" : "star"}
              size={16}
              color={item.source === "must-have" ? colors.primary : colors.accent}
            />
            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.itemCost}>
              {fmt(item.totalLow)}–{fmt(item.totalHigh)}
            </Text>
          </View>
        ))}

        {/* Rationale */}
        <View style={styles.rationaleBox}>
          <Text style={styles.rationaleText}>{graph.rationale}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>View Build Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Share with Contractor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  overviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  overviewValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  itemCost: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  rationaleBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: "#f0f7f2",
    borderRadius: borderRadius.md,
  },
  rationaleText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  actionBtnText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.primary,
  },
});
