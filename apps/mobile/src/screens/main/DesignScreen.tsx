import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type ViewMode = "2d" | "3d";

export function DesignScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("2d");

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === "2d" && styles.toggleActive]}
          onPress={() => setViewMode("2d")}
        >
          <Text style={[styles.toggleText, viewMode === "2d" && styles.toggleTextActive]}>
            2D View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === "3d" && styles.toggleActive]}
          onPress={() => setViewMode("3d")}
        >
          <Text style={[styles.toggleText, viewMode === "3d" && styles.toggleTextActive]}>
            3D View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Canvas Area */}
      <View style={styles.canvas}>
        <Text style={styles.canvasPlaceholder}>
          {viewMode === "2d" ? "2D Floor Plan Canvas" : "3D Room View"}
        </Text>
        <Text style={styles.canvasHint}>
          {viewMode === "2d"
            ? "Drag & drop furniture onto the floor plan"
            : "Rotate and explore your room in 3D"}
        </Text>
      </View>

      {/* Side Panel — Furniture/Item Suggestions */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Suggestions</Text>
        <View style={styles.panelScroll}>
          <TouchableOpacity style={styles.panelItem}>
            <View style={styles.itemThumb} />
            <Text style={styles.itemName}>Add Furniture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelItem}>
            <View style={styles.itemThumb} />
            <Text style={styles.itemName}>Tiles & Flooring</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelItem}>
            <View style={styles.itemThumb} />
            <Text style={styles.itemName}>Wall Colors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelItem}>
            <View style={styles.itemThumb} />
            <Text style={styles.itemName}>Lighting</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelItem}>
            <View style={styles.itemThumb} />
            <Text style={styles.itemName}>Decor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  toggleRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    justifyContent: "center",
  },
  toggleBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  toggleActive: { backgroundColor: "#1a1a2e" },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#666" },
  toggleTextActive: { color: "#fff" },
  canvas: {
    flex: 1,
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 8,
  },
  canvasPlaceholder: { fontSize: 18, fontWeight: "600", color: "#bbb" },
  canvasHint: { fontSize: 13, color: "#ccc" },
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  panelTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a2e", marginBottom: 12 },
  panelScroll: { flexDirection: "row", gap: 12 },
  panelItem: { alignItems: "center", gap: 6, width: 72 },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  itemName: { fontSize: 11, color: "#666", textAlign: "center" },
});
