import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/OnboardingNavigator";
import { Button } from "../../components/Button";
import { DESIGN_STYLE_LABELS } from "@before-the-build/shared";
import type { DesignStyle } from "@before-the-build/shared";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ExploreStyles">;

export function ExploreStylesScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<DesignStyle[]>([]);

  const toggle = (style: DesignStyle) => {
    setSelected((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Explore styles you love</Text>
      <Text style={styles.subtitle}>
        Pick your favourite aesthetics. You can also browse Pinterest, Instagram,
        and more later from the Explore tab.
      </Text>

      <View style={styles.grid}>
        {(Object.entries(DESIGN_STYLE_LABELS) as [DesignStyle, string][]).map(
          ([style, label]) => (
            <TouchableOpacity
              key={style}
              style={[styles.card, selected.includes(style) && styles.cardSelected]}
              onPress={() => toggle(style)}
            >
              {/* TODO: Add style preview images */}
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>
                  {label.charAt(0)}
                </Text>
              </View>
              <Text style={styles.cardLabel}>{label}</Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <Button
        title="Next"
        onPress={() => navigation.navigate("SetGoals")}
        disabled={selected.length === 0}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#1a1a2e" },
  subtitle: { fontSize: 15, color: "#666" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#eee",
    overflow: "hidden",
  },
  cardSelected: { borderColor: "#1a1a2e" },
  imagePlaceholder: {
    height: 100,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 32, fontWeight: "700", color: "#ccc" },
  cardLabel: {
    padding: 10,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#1a1a2e",
  },
});
