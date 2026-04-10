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
import { useWizardStore } from "../../lib/store";
import { WizardProgress } from "../../components/WizardProgress";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "Moodboard">;

export default function MoodboardScreen({ navigation }: Props) {
  const { moodboardManualProducts, mustHaves, niceToHaves } = useWizardStore();

  const totalItems = moodboardManualProducts.length;

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={5} totalSteps={10} stepLabel="Moodboard" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Your Moodboard</Text>
        <Text style={styles.subheading}>
          View and arrange your selected items. This becomes your shopping list for
          contractors and suppliers.
        </Text>

        {/* Shopping list summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.summaryLabel}>Must-Haves</Text>
            <Text style={styles.summaryValue}>{mustHaves.length} items</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="star" size={20} color={colors.accent} />
            <Text style={styles.summaryLabel}>Nice-to-Haves</Text>
            <Text style={styles.summaryValue}>{niceToHaves.length} items</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="cart" size={20} color={colors.sky} />
            <Text style={styles.summaryLabel}>Products Selected</Text>
            <Text style={styles.summaryValue}>{totalItems}</Text>
          </View>
        </View>

        {/* Moodboard canvas placeholder */}
        <View style={styles.canvasPlaceholder}>
          <Ionicons name="images-outline" size={48} color={colors.textMuted} />
          <Text style={styles.canvasTitle}>Moodboard Canvas</Text>
          <Text style={styles.canvasDesc}>
            Your selected products and inspiration images will be displayed here in a
            draggable canvas layout. Tap items to see details or remove them.
          </Text>
        </View>

        {/* Shopping list */}
        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Shopping List</Text>
        {mustHaves.length === 0 && niceToHaves.length === 0 ? (
          <Text style={styles.emptyText}>
            No items selected yet. Go back to "Must-Haves" to add items.
          </Text>
        ) : (
          <>
            {mustHaves.map((item) => (
              <View key={item} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={styles.listItemLabel}>{item}</Text>
              </View>
            ))}
            {niceToHaves.map((item) => (
              <View key={item} style={styles.listItem}>
                <Ionicons name="star" size={16} color={colors.accent} />
                <Text style={styles.listItemLabel}>{item}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("Mockup")}
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
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  canvasPlaceholder: {
    alignItems: "center",
    padding: spacing.xxl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    gap: spacing.sm,
  },
  canvasTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  canvasDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    padding: spacing.lg,
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
