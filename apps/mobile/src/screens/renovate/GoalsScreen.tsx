import React from "react";
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
import { useWizardStore, type BathroomScope } from "../../lib/store";
import { WizardProgress } from "../../components/WizardProgress";
import { SelectionCard } from "../../components/SelectionCard";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "Goals">;

const GOALS = [
  { id: "update_style", label: "Update the style", icon: "color-palette-outline" as const },
  { id: "fix_problems", label: "Fix problems", icon: "construct-outline" as const },
  { id: "increase_value", label: "Increase home value", icon: "trending-up-outline" as const },
  { id: "improve_function", label: "Improve functionality", icon: "settings-outline" as const },
  { id: "accessibility", label: "Accessibility", icon: "accessibility-outline" as const },
  { id: "energy_efficient", label: "Energy efficiency", icon: "leaf-outline" as const },
];

const SCOPES: { id: BathroomScope; label: string; desc: string }[] = [
  { id: "cosmetic", label: "Cosmetic", desc: "Paint, hardware, accessories" },
  { id: "partial", label: "Partial Remodel", desc: "Replace select fixtures, retile" },
  { id: "full", label: "Full Remodel", desc: "Gut and rebuild" },
  { id: "addition", label: "Addition", desc: "New construction / expansion" },
];

export default function GoalsScreen({ navigation }: Props) {
  const { goals, scope, toggleGoal, setScope } = useWizardStore();

  const canProceed = goals.length > 0 && scope !== null;

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={0} totalSteps={10} stepLabel="Goals & Scope" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>What are your goals?</Text>
        <Text style={styles.subheading}>Select all that apply</Text>

        {GOALS.map((g) => (
          <SelectionCard
            key={g.id}
            title={g.label}
            icon={g.icon}
            selected={goals.includes(g.id)}
            onPress={() => toggleGoal(g.id)}
          />
        ))}

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>
          Project scope
        </Text>
        <Text style={styles.subheading}>How extensive is the renovation?</Text>

        {SCOPES.map((s) => (
          <SelectionCard
            key={s.id}
            title={s.label}
            description={s.desc}
            selected={scope === s.id}
            onPress={() => setScope(s.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          disabled={!canProceed}
          onPress={() => navigation.navigate("MustHaves")}
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
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
