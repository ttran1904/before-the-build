import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/OnboardingNavigator";
import { Button } from "../../components/Button";
import { PROJECT_GOAL_LABELS } from "@before-the-build/shared";
import type { ProjectGoal } from "@before-the-build/shared";

type Props = NativeStackScreenProps<OnboardingStackParamList, "SetGoals">;

export function SetGoalsScreen({ navigation }: Props) {
  const [goals, setGoals] = useState<ProjectGoal[]>([]);
  const [mustHaves, setMustHaves] = useState("");
  const [niceToHaves, setNiceToHaves] = useState("");

  const toggleGoal = (goal: ProjectGoal) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What is the goal?</Text>
      <Text style={styles.subtitle}>
        Select your project goals and define your must-haves.
      </Text>

      <View style={styles.grid}>
        {(Object.entries(PROJECT_GOAL_LABELS) as [ProjectGoal, string][]).map(
          ([goal, label]) => (
            <TouchableOpacity
              key={goal}
              style={[styles.chip, goals.includes(goal) && styles.chipSelected]}
              onPress={() => toggleGoal(goal)}
            >
              <Text
                style={[styles.chipText, goals.includes(goal) && styles.chipTextSelected]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <Text style={styles.label}>Must Haves</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={3}
        placeholder="e.g., Open floor plan, island kitchen, walk-in closet..."
        value={mustHaves}
        onChangeText={setMustHaves}
      />

      <Text style={styles.label}>Nice to Haves</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={3}
        placeholder="e.g., Skylight, home gym area, reading nook..."
        value={niceToHaves}
        onChangeText={setNiceToHaves}
      />

      <Button
        title="Next"
        onPress={() => navigation.navigate("ScanRooms")}
        disabled={goals.length === 0}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#1a1a2e" },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 8 },
  label: { fontSize: 15, fontWeight: "600", color: "#1a1a2e", marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  chipSelected: { backgroundColor: "#1a1a2e", borderColor: "#1a1a2e" },
  chipText: { fontSize: 14, color: "#333" },
  chipTextSelected: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
});
