import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/OnboardingNavigator";
import { Button } from "../../components/Button";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ScanRooms">;

export function ScanRoomsScreen({ navigation }: Props) {
  const handleScan = () => {
    // TODO: Launch Apple RoomPlan API (or ARKit) to scan the room
    // This will capture:
    // - Room dimensions
    // - Existing furniture positions
    // - Wall/window/door locations
    // - Nooks and crannies
  };

  const handleSkip = () => {
    // Navigate to main app — user can scan later
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: "Main" as never }],
    });
  };

  const handleFinish = () => {
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: "Main" as never }],
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Scan your rooms</Text>
      <Text style={styles.subtitle}>
        Use your phone's camera to capture the room layout, existing furniture,
        and all the nooks and crannies. This creates an accurate floor plan for
        your design.
      </Text>

      <View style={styles.scanArea}>
        <Text style={styles.scanIcon}>📱</Text>
        <Text style={styles.scanText}>
          Tap "Start Scan" to begin capturing your room with AR
        </Text>
      </View>

      <Button title="Start Scan" onPress={handleScan} />

      <View style={styles.divider} />

      <Text style={styles.orText}>
        You can also add rooms manually or scan later.
      </Text>

      <Button title="Finish Setup" onPress={handleFinish} />
      <Button title="Skip for Now" onPress={handleSkip} variant="outline" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#1a1a2e" },
  subtitle: { fontSize: 15, color: "#666", lineHeight: 22 },
  scanArea: {
    height: 200,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    gap: 12,
  },
  scanIcon: { fontSize: 48 },
  scanText: { fontSize: 14, color: "#888", textAlign: "center", paddingHorizontal: 32 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  orText: { fontSize: 14, color: "#888", textAlign: "center" },
});
