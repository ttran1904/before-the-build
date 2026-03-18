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

type Props = NativeStackScreenProps<OnboardingStackParamList, "HouseholdInfo">;

export function HouseholdInfoScreen({ navigation }: Props) {
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [habits, setHabits] = useState("");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tell us about your household</Text>
      <Text style={styles.subtitle}>
        This helps us tailor recommendations to your lifestyle.
      </Text>

      <Text style={styles.label}>Number of Adults</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={adults}
        onChangeText={setAdults}
      />

      <Text style={styles.label}>Number of Children</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={children}
        onChangeText={setChildren}
      />

      <Text style={styles.label}>Daily Habits & Routines</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={3}
        placeholder="e.g., Work from home, cook daily, exercise at home..."
        value={habits}
        onChangeText={setHabits}
      />

      <Button
        title="Next"
        onPress={() => navigation.navigate("AreasOfInterest")}
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
});
