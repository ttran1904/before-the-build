import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BathroomWizardParamList } from "../../navigation/BathroomWizardNavigator";
import { useWizardStore } from "../../lib/store";
import { WizardProgress } from "../../components/WizardProgress";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

type Props = NativeStackScreenProps<BathroomWizardParamList, "Mockup">;

export default function MockupScreen({ navigation }: Props) {
  const {
    mockupBathroomPhotos,
    mockupGeneratedImages,
    mockupLoading,
    addMockupPhoto,
  } = useWizardStore();

  const handlePickPhoto = async () => {
    // TODO: integrate expo-image-picker
    Alert.alert(
      "Coming Soon",
      "Photo picker will be connected via expo-image-picker.",
    );
  };

  const handleGenerate = () => {
    // TODO: call /api/ai/generate-mockup
    Alert.alert(
      "Coming Soon",
      "AI mockup generation will call the Supabase edge function to render your bathroom with selected items.",
    );
  };

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={6} totalSteps={10} stepLabel="Real Mockup" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>AI Mockup Generator</Text>
        <Text style={styles.subheading}>
          Upload photos of your actual bathroom. Our AI will generate a realistic
          mockup showing what it could look like with your selected items.
        </Text>

        {/* Upload section */}
        <Text style={styles.sectionTitle}>Your Photos</Text>
        <View style={styles.photoGrid}>
          {mockupBathroomPhotos.map((uri, idx) => (
            <View key={idx} style={styles.photoCard}>
              <Image source={{ uri }} style={styles.photo} />
            </View>
          ))}
          <TouchableOpacity
            style={styles.addCard}
            onPress={handlePickPhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={36} color={colors.primary} />
            <Text style={styles.addText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[
            styles.generateBtn,
            mockupBathroomPhotos.length === 0 && styles.generateBtnDisabled,
          ]}
          disabled={mockupBathroomPhotos.length === 0 || mockupLoading}
          onPress={handleGenerate}
          activeOpacity={0.8}
        >
          {mockupLoading ? (
            <Text style={styles.generateText}>Generating...</Text>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={colors.white} />
              <Text style={styles.generateText}>Generate AI Mockup</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated images */}
        {mockupGeneratedImages.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
              Generated Mockups
            </Text>
            {mockupGeneratedImages.map((uri, idx) => (
              <View key={idx} style={styles.mockupCard}>
                <Image
                  source={{ uri }}
                  style={styles.mockupImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("Timeline")}
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  photoCard: {
    width: "47%",
    flexGrow: 1,
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  addCard: {
    width: "47%",
    flexGrow: 1,
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: "#f0f7f2",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  addText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  mockupCard: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  mockupImage: {
    width: "100%",
    aspectRatio: 16 / 9,
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
