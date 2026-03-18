import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { INSPIRATION_SOURCE_LABELS } from "@before-the-build/shared";
import type { InspirationSource } from "@before-the-build/shared";

export function ExploreScreen() {
  const [activeSource, setActiveSource] = useState<InspirationSource | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const sources = Object.entries(INSPIRATION_SOURCE_LABELS) as [InspirationSource, string][];

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for inspiration..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Source Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <TouchableOpacity
          style={[styles.filterChip, activeSource === "all" && styles.filterActive]}
          onPress={() => setActiveSource("all")}
        >
          <Text style={[styles.filterText, activeSource === "all" && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {sources.map(([source, label]) => (
          <TouchableOpacity
            key={source}
            style={[styles.filterChip, activeSource === source && styles.filterActive]}
            onPress={() => setActiveSource(source)}
          >
            <Text
              style={[
                styles.filterText,
                activeSource === source && styles.filterTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Inspiration Grid */}
      <View style={styles.gridContainer}>
        {/* TODO: Fetch from mood board / search API */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Discover Ideas</Text>
          <Text style={styles.emptyText}>
            Search across Pinterest, Instagram, Etsy, and more to build your
            mood board and find the perfect aesthetic for your space.
          </Text>
        </View>
      </View>

      {/* Save to Mood Board FAB */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+ Mood Board</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  filters: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  filterActive: { backgroundColor: "#1a1a2e", borderColor: "#1a1a2e" },
  filterText: { fontSize: 13, color: "#666" },
  filterTextActive: { color: "#fff" },
  gridContainer: { flex: 1, padding: 16 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "600", color: "#1a1a2e" },
  emptyText: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
