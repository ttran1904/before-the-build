import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

export function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Welcome back!</Text>
      <Text style={styles.subtitle}>Your renovation journey at a glance.</Text>

      {/* Active Project Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Project</Text>
        <Text style={styles.cardBody}>No active project yet. Start by creating one!</Text>
        <TouchableOpacity style={styles.cardAction}>
          <Text style={styles.cardActionText}>+ New Project</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionLabel}>Scan Room</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>🎨</Text>
          <Text style={styles.actionLabel}>Explore Styles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionLabel}>Ask AI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📐</Text>
          <Text style={styles.actionLabel}>Design Room</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          Your recent activity will show up here.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  content: { padding: 24, gap: 20 },
  greeting: { fontSize: 28, fontWeight: "700", color: "#1a1a2e" },
  subtitle: { fontSize: 15, color: "#666", marginTop: -12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a2e" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a2e" },
  cardBody: { fontSize: 14, color: "#666" },
  cardAction: {
    marginTop: 8,
    backgroundColor: "#1a1a2e",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  cardActionText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#1a1a2e" },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: "#999" },
});
