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

type Props = NativeStackScreenProps<BathroomWizardParamList, "ItemsPictures">;

export default function ItemsPicturesScreen({ navigation }: Props) {
  const { mockupBathroomPhotos, addMockupPhoto, removeMockupPhoto } =
    useWizardStore();

  const handlePickImage = async () => {
    // TODO: integrate expo-image-picker
    Alert.alert(
      "Coming Soon",
      "Photo picker will be connected via expo-image-picker. Upload a bathroom photo to identify items and find matching products.",
    );
  };

  return (
    <View style={styles.container}>
      <WizardProgress currentStep={3} totalSteps={10} stepLabel="Items from Pictures" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Identify items from photos</Text>
        <Text style={styles.subheading}>
          Upload bathroom photos and draw boxes around items you want to replace.
          Our AI will identify them and find matching products.
        </Text>

        {/* Photo grid */}
        <View style={styles.photoGrid}>
          {mockupBathroomPhotos.map((uri, idx) => (
            <View key={idx} style={styles.photoCard}>
              <Image source={{ uri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => removeMockupPhoto(idx)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addPhotoCard}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={36} color={colors.primary} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Placeholder for crop box + AI identification */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            After adding photos, tap and drag on items to identify them.
            The AI will search for matching products you can add to your moodboard.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("Catalogue")}
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
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoRemove: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
  },
  addPhotoCard: {
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
  addPhotoText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  infoBox: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: "#f0f7f2",
    borderRadius: borderRadius.md,
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
