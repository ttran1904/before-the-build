import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

export function BuildBookScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Build Book</Text>
      <Text style={styles.subtitle}>
        Your comprehensive project review — everything in one place.
      </Text>

      {/* Scope */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Scope Description</Text>
        <Text style={styles.sectionBody}>
          No build book generated yet. Complete your room designs to generate
          a comprehensive review.
        </Text>
      </View>

      {/* 2D Layouts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📐 2D Layouts</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Room floor plans will appear here</Text>
        </View>
      </View>

      {/* 3D Layouts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 3D Layouts</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>3D room renders will appear here</Text>
        </View>
      </View>

      {/* Movement Flow */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏃 Movement Flow</Text>
        <Text style={styles.sectionBody}>
          A gaming-like simulation showing how people, children, and pets move
          through the space. Available after finalizing your design.
        </Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Movement simulation preview</Text>
        </View>
      </View>

      {/* Cost Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Cost Summary</Text>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Total Estimated Cost</Text>
          <Text style={styles.costValue}>$0.00</Text>
        </View>
      </View>

      {/* Generate / Export */}
      <TouchableOpacity style={styles.generateBtn}>
        <Text style={styles.generateBtnText}>Generate Build Book</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exportBtn}>
        <Text style={styles.exportBtnText}>Export as PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 28, fontWeight: "700", color: "#1a1a2e" },
  subtitle: { fontSize: 15, color: "#666", marginTop: -12 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a2e" },
  sectionBody: { fontSize: 14, color: "#666", lineHeight: 20 },
  placeholder: {
    height: 120,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 13, color: "#bbb" },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  costLabel: { fontSize: 14, color: "#666" },
  costValue: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  generateBtn: {
    backgroundColor: "#1a1a2e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  generateBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  exportBtn: {
    borderWidth: 1,
    borderColor: "#1a1a2e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  exportBtnText: { color: "#1a1a2e", fontWeight: "600", fontSize: 16 },
});
