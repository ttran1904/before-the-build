import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/OnboardingNavigator";
import { Button } from "../../components/Button";
import { ROOM_TYPE_LABELS } from "@before-the-build/shared";
import type { RoomType } from "@before-the-build/shared";

type Props = NativeStackScreenProps<OnboardingStackParamList, "AreasOfInterest">;

export function AreasOfInterestScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<RoomType[]>([]);

  const toggle = (type: RoomType) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What areas do you want to change?</Text>
      <Text style={styles.subtitle}>Select all rooms you'd like to redesign.</Text>

      <View style={styles.grid}>
        {(Object.entries(ROOM_TYPE_LABELS) as [RoomType, string][]).map(
          ([type, label]) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, selected.includes(type) && styles.chipSelected]}
              onPress={() => toggle(type)}
            >
              <Text
                style={[
                  styles.chipText,
                  selected.includes(type) && styles.chipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <Button
        title="Next"
        onPress={() => navigation.navigate("ExploreStyles")}
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  chipSelected: {
    backgroundColor: "#1a1a2e",
    borderColor: "#1a1a2e",
  },
  chipText: { fontSize: 14, color: "#333" },
  chipTextSelected: { color: "#fff" },
});
