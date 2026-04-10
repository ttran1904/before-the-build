import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BathroomWizardParamList } from "../../navigation/BathroomWizardNavigator";
import { WizardProgress } from "../../components/WizardProgress";
import { Chip } from "../../components/Chip";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "Catalogue">;

const CATEGORIES = [
  "All",
  "Vanities",
  "Toilets",
  "Showers",
  "Tile",
  "Fixtures",
  "Lighting",
  "Mirrors",
  "Accessories",
];

export default function CatalogueScreen({ navigation }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={4} totalSteps={10} stepLabel="Catalogue" />

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            selected={activeCategory === cat}
            onPress={() => setActiveCategory(cat)}
          />
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Browse Products</Text>
        <Text style={styles.subheading}>
          Tap products to add them to your moodboard. Prices update your budget
          estimate in real-time.
        </Text>

        {/* Product grid placeholder */}
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Product catalogue</Text>
          <Text style={styles.emptyDesc}>
            Products will load from the API based on your selected category, budget
            tier, and bathroom style.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("Moodboard")}
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
  categories: {
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
  emptyState: {
    alignItems: "center",
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
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
