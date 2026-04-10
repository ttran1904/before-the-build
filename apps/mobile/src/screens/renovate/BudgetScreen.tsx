import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BathroomWizardParamList } from "../../navigation/BathroomWizardNavigator";
import { useWizardStore, type BudgetTier } from "../../lib/store";
import { BATHROOM_SIZES, type BathroomSize, computeBudgetGraph } from "@before-the-build/shared";
import { WizardProgress } from "../../components/WizardProgress";
import { BudgetRangeCard } from "../../components/BudgetRangeCard";
import { SelectionCard } from "../../components/SelectionCard";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "Budget">;

const TIERS: { id: BudgetTier; label: string; desc: string }[] = [
  { id: "basic", label: "Basic", desc: "Budget-friendly materials" },
  { id: "mid", label: "Mid-Range", desc: "Quality upgrades" },
  { id: "high", label: "High-End", desc: "Premium finishes" },
];

export default function BudgetScreen({ navigation }: Props) {
  const {
    budgetTier,
    budgetAmount,
    bathroomSize,
    mustHaves,
    niceToHaves,
    scope,
    priceOverrides,
    setBudgetTier,
    setBudgetAmount,
    setBathroomSize,
  } = useWizardStore();

  const graph = useMemo(
    () =>
      computeBudgetGraph({
        roomSize: bathroomSize,
        scope,
        mustHaves,
        niceToHaves,
        includeNiceToHaves: true,
        customerBudget: budgetAmount,
        priceOverrides,
      }),
    [bathroomSize, scope, mustHaves, niceToHaves, budgetAmount, priceOverrides],
  );

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={2} totalSteps={10} stepLabel="Budget" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bathroom size */}
        <Text style={styles.heading}>Bathroom size</Text>
        {BATHROOM_SIZES.map((size) => (
          <SelectionCard
            key={size.id}
            title={size.label}
            description={`${size.desc} · ${size.sqft}`}
            selected={bathroomSize === size.id}
            onPress={() => setBathroomSize(size.id)}
          />
        ))}

        {/* Budget tier */}
        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Budget tier</Text>
        <View style={styles.tierRow}>
          {TIERS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tierCard, budgetTier === t.id && styles.tierCardSelected]}
              onPress={() => setBudgetTier(t.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tierLabel, budgetTier === t.id && styles.tierLabelSelected]}
              >
                {t.label}
              </Text>
              <Text style={styles.tierDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget amount */}
        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Your budget</Text>
        <View style={styles.inputRow}>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            style={styles.input}
            value={budgetAmount?.toString() ?? ""}
            onChangeText={(v) => {
              const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
              if (!isNaN(n)) setBudgetAmount(n);
            }}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Estimate */}
        <View style={{ marginTop: spacing.xl }}>
          <BudgetRangeCard
            label="Estimated Cost"
            low={graph.estimatedLow}
            high={graph.estimatedHigh}
            mid={graph.estimatedMid}
            warning={graph.budgetWarning}
          />
        </View>

        {/* Breakdown */}
        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Breakdown</Text>
        {graph.breakdown.map((b) => (
          <View key={b.category} style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{b.category}</Text>
            <View style={styles.breakdownBarTrack}>
              <View
                style={[styles.breakdownBarFill, { width: `${b.pct}%` }]}
              />
            </View>
            <Text style={styles.breakdownPct}>{b.pct}%</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("ItemsPictures")}
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
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tierRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tierCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  tierCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f0f7f2",
  },
  tierLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tierLabelSelected: { color: colors.primary },
  tierDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  dollar: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: "600",
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  breakdownLabel: {
    width: 110,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  breakdownBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  breakdownPct: {
    width: 40,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "right",
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
