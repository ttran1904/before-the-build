import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BathroomWizardParamList } from "../../navigation/BathroomWizardNavigator";
import { useWizardStore } from "../../lib/store";
import { WizardProgress } from "../../components/WizardProgress";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "MustHaves">;

/**
 * Gallery items — labels match ITEM_COST keys in the budget engine
 * so budget calculations stay in sync across web & mobile
 */
const GALLERY_ITEMS = [
  { label: "New tile (floor)", icon: "grid-outline" as const },
  { label: "New tile (shower walls)", icon: "grid-outline" as const },
  { label: "Non-slip flooring", icon: "footsteps-outline" as const },
  { label: "Heated floors", icon: "flame-outline" as const },
  { label: "Single vanity", icon: "water-outline" as const },
  { label: "Double vanity", icon: "water-outline" as const },
  { label: "Comfort-height toilet", icon: "ellipse-outline" as const },
  { label: "Bidet/bidet seat", icon: "water-outline" as const },
  { label: "Exhaust fan upgrade", icon: "fan-outline" as const },
  { label: "Recessed lighting", icon: "bulb-outline" as const },
  { label: "Dimmer switches", icon: "toggle-outline" as const },
  { label: "LED mirror", icon: "scan-outline" as const },
  { label: "Walk-in shower", icon: "rainy-outline" as const },
  { label: "Bathtub", icon: "water-outline" as const },
  { label: "Glass shower door", icon: "tablet-landscape-outline" as const },
  { label: "Rain showerhead", icon: "rainy-outline" as const },
  { label: "Handheld showerhead", icon: "rainy-outline" as const },
  { label: "Medicine cabinet", icon: "medkit-outline" as const },
  { label: "Built-in shelving", icon: "albums-outline" as const },
  { label: "Towel warmer", icon: "thermometer-outline" as const },
  { label: "Grab bars", icon: "remove-outline" as const },
];

type ItemState = "none" | "must" | "nice";

export default function MustHavesScreen({ navigation }: Props) {
  const { mustHaves, niceToHaves, setMustHaves, setNiceToHaves } = useWizardStore();

  const getState = (label: string): ItemState => {
    if (mustHaves.includes(label)) return "must";
    if (niceToHaves.includes(label)) return "nice";
    return "none";
  };

  const cycle = (label: string) => {
    const state = getState(label);
    if (state === "none") {
      setMustHaves([...mustHaves, label]);
    } else if (state === "must") {
      setMustHaves(mustHaves.filter((i) => i !== label));
      setNiceToHaves([...niceToHaves, label]);
    } else {
      setNiceToHaves(niceToHaves.filter((i) => i !== label));
    }
  };

  const stateColor = (s: ItemState) =>
    s === "must" ? colors.primary : s === "nice" ? colors.accent : colors.border;
  const stateLabel = (s: ItemState) =>
    s === "must" ? "Must-Have" : s === "nice" ? "Nice-to-Have" : "Tap to add";

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={1} totalSteps={10} stepLabel="Must-Haves" />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Must-Have</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Nice-to-Have</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {GALLERY_ITEMS.map((item) => {
          const state = getState(item.label);
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.card, { borderColor: stateColor(state) }]}
              onPress={() => cycle(item.label)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={28}
                color={state === "none" ? colors.textMuted : stateColor(state)}
              />
              <Text style={styles.cardLabel} numberOfLines={2}>
                {item.label}
              </Text>
              <Text
                style={[styles.cardState, { color: stateColor(state) }]}
              >
                {stateLabel(state)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.counts}>
          {mustHaves.length} must-haves · {niceToHaves.length} nice-to-haves
        </Text>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("Budget")}
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
  legend: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: fontSize.xs, color: colors.textSecondary },
  scroll: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  cardState: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  counts: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
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
