import React, { useState } from "react";
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
import { WizardProgress } from "../../components/WizardProgress";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "Contractor">;

export default function ContractorScreen({ navigation }: Props) {
  const [zipCode, setZipCode] = useState("");

  const handleSearch = () => {
    // TODO: call /api/ai/search-contractors
  };

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={8} totalSteps={10} stepLabel="Find Contractors" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Find Contractors</Text>
        <Text style={styles.subheading}>
          Search for bathroom renovation contractors in your area. We search
          across Thumbtack and Google to find the best matches.
        </Text>

        {/* Zip code input */}
        <View style={styles.searchRow}>
          <Ionicons name="location-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            value={zipCode}
            onChangeText={setZipCode}
            placeholder="Enter zip code"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={5}
          />
          <TouchableOpacity
            style={[styles.searchBtn, zipCode.length < 5 && { opacity: 0.4 }]}
            disabled={zipCode.length < 5}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Results placeholder */}
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No contractors yet</Text>
          <Text style={styles.emptyDesc}>
            Enter your zip code to search for bathroom renovation contractors.
            Results will show ratings, reviews, and pricing ranges.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("Summary")}
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderTopRightRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
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
