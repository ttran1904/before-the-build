import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ─── Room scene illustration ─── */
function RoomScene({
  type,
  label,
  style,
}: {
  type: "kitchen" | "coastal" | "japandi" | "bathroom" | "industrial";
  label: string;
  style?: object;
}) {
  const configs = {
    kitchen: {
      wall: "#f5f0eb",
      elements: [
        // Upper cabinets
        { top: "8%", left: "4%", width: "30%", height: "22%", bg: "#e0d5c5", radius: 4 },
        { top: "8%", right: "4%", width: "30%", height: "22%", bg: "#e0d5c5", radius: 4 },
        // Window
        { top: "6%", left: "38%", width: "24%", height: "28%", bg: "#c5dff0", radius: 4, border: "#d4c5a0" },
        // Backsplash
        { top: "34%", left: "0%", width: "100%", height: "12%", bg: "#eae3d8", radius: 0 },
        // Counter
        { top: "46%", left: "0%", width: "100%", height: "4%", bg: "#c9b99a", radius: 0 },
        // Lower cabinets
        { top: "50%", left: "0%", width: "100%", height: "50%", bg: "#e8ddd0", radius: 0 },
        // Island
        { bottom: "6%", left: "22%", width: "56%", height: "18%", bg: "#d4a574", radius: 8 },
      ],
    },
    coastal: {
      wall: "#eaf2f8",
      elements: [
        { top: "6%", left: "8%", width: "35%", height: "40%", bg: "#c5dff0", radius: 4, border: "#b0c4d4" },
        { bottom: "4%", left: "10%", width: "50%", height: "28%", bg: "#e8e4de", radius: 10 },
        { bottom: "8%", left: "30%", width: "22%", height: "7%", bg: "#c9b99a", radius: 4 },
        { bottom: "12%", right: "8%", width: "12%", height: "30%", bg: "#7cb87c", radius: 20 },
      ],
    },
    japandi: {
      wall: "#f0ebe4",
      elements: [
        { bottom: "10%", left: "12%", width: "60%", height: "24%", bg: "#c9b99a", radius: 8 },
        { bottom: "26%", left: "12%", width: "60%", height: "8%", bg: "#b8a88a", radius: 4 },
        { bottom: "28%", left: "22%", width: "14%", height: "5%", bg: "#ffffff", radius: 10 },
        { bottom: "28%", left: "42%", width: "14%", height: "5%", bg: "#e8e0d4", radius: 10 },
        { bottom: "10%", right: "10%", width: "12%", height: "18%", bg: "#a09080", radius: 4 },
        { top: "18%", right: "13%", width: 28, height: 28, bg: "#f5e6c8", radius: 14 },
      ],
    },
    bathroom: {
      wall: "#f5f0eb",
      elements: [
        { top: "10%", left: "10%", width: "80%", height: 1, bg: "#c9b99a" },
        { top: "20%", left: "10%", width: "80%", height: 1, bg: "#c9b99a" },
        { top: "30%", left: "10%", width: "80%", height: 1, bg: "#c9b99a" },
        { top: "8%", right: "18%", width: 48, height: 56, bg: "#e8e4de", radius: 28, border: "#c9b99a" },
        { bottom: "4%", left: "8%", width: "45%", height: "26%", bg: "#ffffff", radius: 30, border: "#d4c5a0" },
        { bottom: "8%", right: "12%", width: "25%", height: "28%", bg: "#d4a574", radius: 6 },
      ],
    },
    industrial: {
      wall: "#6a6a6a",
      elements: [
        { top: "5%", left: "15%", width: "45%", height: "55%", bg: "#b0c4d4", radius: 4, opacity: 0.25 },
        { top: "4%", left: "0%", width: "100%", height: 4, bg: "#555555" },
        { top: "10%", left: "0%", width: "100%", height: 3, bg: "#555555", opacity: 0.6 },
        { bottom: "0%", left: "0%", width: "100%", height: "22%", bg: "#8a8a7a", opacity: 0.4 },
        { top: "30%", right: "8%", width: "18%", height: 1, bg: "#999" },
        { top: "42%", right: "8%", width: "18%", height: 1, bg: "#999" },
      ],
    },
  };
  const cfg = configs[type];
  return (
    <View style={[{ borderRadius: 12, overflow: "hidden", position: "relative", backgroundColor: cfg.wall }, style]}>
      {cfg.elements.map((el, i) => (
        <View
          key={i}
          style={[{
            position: "absolute",
            backgroundColor: el.bg,
            borderRadius: el.radius || 0,
            opacity: (el as any).opacity ?? 1,
            ...(el.border ? { borderWidth: 1.5, borderColor: el.border } : {}),
            ...(el.top !== undefined ? { top: el.top } : {}),
            ...(el.bottom !== undefined ? { bottom: el.bottom } : {}),
            ...(el.left !== undefined ? { left: el.left } : {}),
            ...(el.right !== undefined ? { right: el.right } : {}),
            width: el.width as any,
            height: el.height as any,
          }]}
        />
      ))}
      <View style={{ position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>{label}</Text>
      </View>
    </View>
  );
}

/* ─── Budget bar component ─── */
function BudgetBar({
  label,
  spent,
  budget,
  color,
}: {
  label: string;
  spent: number;
  budget: number;
  color: string;
}) {
  return (
    <View style={styles.budgetBarRow}>
      <View style={styles.budgetBarHeader}>
        <Text style={styles.budgetBarLabel}>{label}</Text>
        <Text style={styles.budgetBarValue}>
          ${(spent / 1000).toFixed(1)}k / ${(budget / 1000).toFixed(1)}k
        </Text>
      </View>
      <View style={styles.budgetBarTrack}>
        <View
          style={[
            styles.budgetBarFill,
            { width: `${(spent / budget) * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

/* ─── Gantt row component ─── */
function GanttRow({
  task,
  color,
  widthPercent,
  offsetPercent,
}: {
  task: string;
  color: string;
  widthPercent: number;
  offsetPercent: number;
}) {
  return (
    <View style={styles.ganttRow}>
      <Text style={styles.ganttTask} numberOfLines={1}>
        {task}
      </Text>
      <View style={styles.ganttTrack}>
        <View
          style={[
            styles.ganttBar,
            {
              backgroundColor: color,
              width: `${widthPercent}%`,
              left: `${offsetPercent}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ━━━ Hero Greeting ━━━ */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>ALL-IN-ONE RENOVATION</Text>
        <Text style={styles.heroTitle}>
          Plan, Design &{"\n"}
          <Text style={{ color: "#2d5a3d" }}>Build Smarter</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Scan rooms, explore styles, manage budgets & timelines, and create
          contractor-ready build books.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("BathroomWizard")}
          >
            <Text style={styles.primaryBtnText}>Start Bathroom Renovation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Explore</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ━━━ Active Project Card ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Project</Text>
      </View>
      <View style={styles.projectCard}>
        <View style={styles.projectCardHeader}>
          <View>
            <Text style={styles.projectCardTitle}>Kitchen Remodel</Text>
            <Text style={styles.projectCardSub}>Modern Farmhouse • 12&apos; × 14&apos;</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>In Progress</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPercent}>42%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "42%" }]} />
          </View>
        </View>
        {/* Mini stats */}
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>$28.3k</Text>
            <Text style={styles.miniStatLabel}>Spent</Text>
          </View>
          <View style={[styles.miniStat, styles.miniStatBorder]}>
            <Text style={styles.miniStatValue}>$47.2k</Text>
            <Text style={styles.miniStatLabel}>Budget</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>12</Text>
            <Text style={styles.miniStatLabel}>Tasks</Text>
          </View>
          <View style={[styles.miniStat, styles.miniStatBorder]}>
            <Text style={styles.miniStatValue}>Jun 15</Text>
            <Text style={styles.miniStatLabel}>Target</Text>
          </View>
        </View>
      </View>

      {/* ━━━ Quick Actions ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.quickActions}>
        {[
          { icon: "camera" as const, label: "Scan Room", bg: "#e8d5b7" },
          { icon: "palette" as const, label: "Explore Styles", bg: "#bde0c0" },
          { icon: "chat" as const, label: "Ask AI", bg: "#d4c5e8" },
          { icon: "pencil-ruler" as const, label: "Design Room", bg: "#dce8f0" },
          { icon: "currency-usd" as const, label: "Budget", bg: "#f0d0b0" },
          { icon: "book-open-variant" as const, label: "Build Book", bg: "#e0d4c0" },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionCard}>
            <View style={[styles.actionIconWrap, { backgroundColor: a.bg }]}>
              <MaterialCommunityIcons name={a.icon} size={22} color="#4a4a5a" />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ━━━ Trending Designs (Houzz-style) ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending Designs</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
        {[
          { type: "kitchen" as const, label: "Modern Farmhouse Kitchen" },
          { type: "coastal" as const, label: "Coastal Living Room" },
          { type: "japandi" as const, label: "Japandi Bedroom" },
          { type: "bathroom" as const, label: "Mid-Century Bathroom" },
          { type: "industrial" as const, label: "Industrial Loft" },
        ].map((item) => (
          <RoomScene
            key={item.label}
            type={item.type}
            label={item.label}
            style={{ width: SCREEN_WIDTH * 0.55, height: 180, marginRight: 12 }}
          />
        ))}
      </ScrollView>
      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {["Kitchen", "Bathroom", "Living Room", "Bedroom", "Outdoor", "Office", "Basement"].map(
          (cat) => (
            <TouchableOpacity key={cat} style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{cat}</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* ━━━ Budget Overview (Realm / HomeZada style) ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Budget Overview</Text>
      </View>
      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetTitle}>Kitchen Remodel</Text>
          <View style={styles.budgetBadge}>
            <Text style={styles.budgetBadgeText}>On Track</Text>
          </View>
        </View>
        {/* Summary row */}
        <View style={styles.budgetSummary}>
          <View style={[styles.budgetSummaryItem, { backgroundColor: "#f8f7f4" }]}>
            <Text style={styles.budgetSummaryLabel}>Total</Text>
            <Text style={styles.budgetSummaryValue}>$47,200</Text>
          </View>
          <View style={[styles.budgetSummaryItem, { backgroundColor: "#f8f7f4" }]}>
            <Text style={styles.budgetSummaryLabel}>Spent</Text>
            <Text style={[styles.budgetSummaryValue, { color: "#d4956a" }]}>$28,340</Text>
          </View>
          <View style={[styles.budgetSummaryItem, { backgroundColor: "#eef7ee" }]}>
            <Text style={styles.budgetSummaryLabel}>Left</Text>
            <Text style={[styles.budgetSummaryValue, { color: "#2d5a3d" }]}>$18,860</Text>
          </View>
        </View>
        {/* Bars */}
        <BudgetBar label="Cabinets" spent={8300} budget={12000} color="#2d5a3d" />
        <BudgetBar label="Countertops" spent={7500} budget={8000} color="#d4956a" />
        <BudgetBar label="Flooring" spent={4200} budget={6500} color="#87CEEB" />
        <BudgetBar label="Appliances" spent={5300} budget={9000} color="#d4c5e8" />
        <BudgetBar label="Labor" spent={3040} budget={11700} color="#e8d5b7" />

        {/* Pie chart placeholder */}
        <View style={styles.pieRow}>
          <View style={styles.pieChart}>
            <View style={[styles.pieSlice, { backgroundColor: "#2d5a3d" }]} />
            <View style={styles.pieCenter}>
              <Text style={styles.pieCenterText}>60%</Text>
            </View>
          </View>
          <View style={styles.pieLegend}>
            {[
              { label: "Materials 40%", color: "#2d5a3d" },
              { label: "Labor 25%", color: "#d4956a" },
              { label: "Fixtures 20%", color: "#87CEEB" },
              { label: "Other 15%", color: "#e8e6e1" },
            ].map((item) => (
              <View key={item.label} style={styles.pieLegendItem}>
                <View style={[styles.pieDot, { backgroundColor: item.color }]} />
                <Text style={styles.pieLegendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ━━━ Timeline (Asana Gantt-style) ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Project Timeline</Text>
      </View>
      <View style={styles.timelineCard}>
        <View style={styles.timelineViewTabs}>
          {["Gantt", "Board", "List"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.timelineTab,
                tab === "Gantt" && styles.timelineTabActive,
              ]}
            >
              <Text
                style={[
                  styles.timelineTabText,
                  tab === "Gantt" && styles.timelineTabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Month headers */}
        <View style={styles.ganttMonths}>
          <View style={{ width: 90 }} />
          <View style={styles.ganttMonthRow}>
            <Text style={styles.ganttMonth}>Mar</Text>
            <Text style={styles.ganttMonth}>Apr</Text>
            <Text style={styles.ganttMonth}>May</Text>
            <Text style={styles.ganttMonth}>Jun</Text>
          </View>
        </View>
        <GanttRow task="Demo & Tear-Out" color="#d4956a" widthPercent={18} offsetPercent={0} />
        <GanttRow task="Rough Plumbing" color="#2d5a3d" widthPercent={22} offsetPercent={12} />
        <GanttRow task="Electrical" color="#87CEEB" widthPercent={18} offsetPercent={15} />
        <GanttRow task="Cabinets" color="#d4c5e8" widthPercent={15} offsetPercent={32} />
        <GanttRow task="Countertops" color="#e8d5b7" widthPercent={10} offsetPercent={45} />
        <GanttRow task="Paint & Trim" color="#bde0c0" widthPercent={20} offsetPercent={55} />
        <GanttRow task="Final Inspect" color="#f0d0b0" widthPercent={10} offsetPercent={78} />
      </View>

      {/* ━━━ Task Board Mini (Asana Kanban) ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Task Board</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          {
            status: "To Do",
            color: "#e8e6e1",
            tasks: ["Order backsplash tile", "Get permit sign-off"],
          },
          {
            status: "In Progress",
            color: "#87CEEB",
            tasks: ["Install upper cabinets", "Wire island outlets"],
          },
          {
            status: "Review",
            color: "#d4c5e8",
            tasks: ["Countertop measurement"],
          },
          {
            status: "Done",
            color: "#bde0c0",
            tasks: ["Demo complete", "Plumbing rough-in", "Subfloor prep"],
          },
        ].map((col) => (
          <View key={col.status} style={styles.kanbanColumn}>
            <View style={styles.kanbanHeader}>
              <View style={[styles.kanbanDot, { backgroundColor: col.color }]} />
              <Text style={styles.kanbanStatus}>{col.status}</Text>
              <Text style={styles.kanbanCount}>{col.tasks.length}</Text>
            </View>
            {col.tasks.map((t) => (
              <View key={t} style={styles.kanbanTask}>
                <Text style={styles.kanbanTaskText}>{t}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* ━━━ Find Professionals (Houzz-style) ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Find Professionals</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { name: "Sarah Chen", role: "Interior Designer", rating: "4.9", reviews: 127, initial: "S", bg: "#a8956a" },
          { name: "Mike Torres", role: "General Contractor", rating: "4.8", reviews: 89, initial: "M", bg: "#6da06d" },
          { name: "Lisa Park", role: "Kitchen Specialist", rating: "5.0", reviews: 64, initial: "L", bg: "#8a6aaa" },
          { name: "James Wright", role: "Electrician", rating: "4.7", reviews: 215, initial: "J", bg: "#5a8ab0" },
        ].map((pro) => (
          <View key={pro.name} style={styles.proCard}>
            <View style={[styles.proAvatar, { backgroundColor: pro.bg }]}>
              <Text style={styles.proAvatarText}>{pro.initial}</Text>
            </View>
            <Text style={styles.proName}>{pro.name}</Text>
            <Text style={styles.proRole}>{pro.role}</Text>
            <View style={styles.proRating}>
              <MaterialCommunityIcons name="star" size={14} color="#f0b429" />
              <Text style={styles.proRatingText}>{pro.rating}</Text>
              <Text style={styles.proReviews}>({pro.reviews})</Text>
            </View>
            <View style={styles.proBadges}>
              <Text style={styles.proBadge}>Licensed</Text>
              <Text style={styles.proBadge}>Insured</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ━━━ AI Design Preview ━━━ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>AI Design Studio</Text>
      </View>
      <View style={styles.designCard}>
        {/* Mock 3D view */}
        <View style={styles.designPreview}>
          {/* Room scene elements */}
          <View style={{ position: "absolute", left: "25%", top: "4%", width: "30%", height: "44%", backgroundColor: "#c5dff0", opacity: 0.3, borderRadius: 4, borderWidth: 1.5, borderColor: "rgba(201,185,154,0.5)" }} />
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", backgroundColor: "#d4cabb", opacity: 0.6 }} />
          <View style={{ position: "absolute", bottom: "12%", left: "8%", width: "36%", height: "22%", borderRadius: 8, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(184,168,138,0.5)", backgroundColor: "rgba(232,221,208,0.4)" }} />
          <View style={{ position: "absolute", bottom: "16%", left: "50%", width: "16%", height: "10%", borderRadius: 4, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(184,168,138,0.5)", backgroundColor: "rgba(201,185,154,0.2)" }} />
          <View style={{ position: "absolute", right: "6%", top: "8%", width: "12%", height: "60%", borderRadius: 4, borderWidth: 1, borderColor: "rgba(201,185,154,0.3)", backgroundColor: "rgba(224,213,197,0.4)" }} />
          <View style={styles.designPreviewInner}>
            <View style={styles.designPreviewTop}>
              <View style={styles.designDimension}>
                <Text style={styles.designDimensionText}>12' × 14'</Text>
              </View>
              <View style={styles.designDimension}>
                <Text style={styles.designDimensionText}>Window</Text>
              </View>
            </View>
            <View style={styles.designPreviewBottom}>
              <View style={styles.designGhost} />
              <View style={[styles.designGhost, { width: 40, height: 28 }]} />
              <TouchableOpacity style={styles.addFurnitureBtn}>
                <Text style={styles.addFurnitureBtnText}>+ Add Furniture</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Furniture slider */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.furnitureSlider}
        >
          {[
            { name: "Sofa", price: "$899", bg: "#e8d5b7" },
            { name: "Coffee Table", price: "$349", bg: "#d4c5e8" },
            { name: "Floor Lamp", price: "$129", bg: "#bde0c0" },
            { name: "Rug 8×10", price: "$599", bg: "#f0d0b0" },
            { name: "Bookshelf", price: "$449", bg: "#dce8f0" },
          ].map((item) => (
            <View key={item.name} style={styles.furnitureItem}>
              <View style={[styles.furnitureSwatch, { backgroundColor: item.bg }]} />
              <Text style={styles.furnitureName}>{item.name}</Text>
              <Text style={styles.furniturePrice}>{item.price}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.designToggle}>
          <TouchableOpacity style={styles.designToggleActive}>
            <Text style={styles.designToggleActiveText}>3D View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.designToggleInactive}>
            <Text style={styles.designToggleInactiveText}>2D Plan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ━━━ Build Book CTA ━━━ */}
      <View style={styles.buildBookCta}>
        <Text style={styles.buildBookLabel}>THE FINAL DELIVERABLE</Text>
        <Text style={styles.buildBookTitle}>Your Build Book</Text>
        <Text style={styles.buildBookDesc}>
          A contractor-ready document with floor plans, 3D renders, budgets,
          timelines, and product links.
        </Text>
        <View style={styles.buildBookPages}>
          {[
            { icon: "compass-outline" as const, title: "Floor Plans", bg: "#2d5a3d" },
            { icon: "home-outline" as const, title: "3D Renders", bg: "#d4956a" },
            { icon: "cash-multiple" as const, title: "Budget", bg: "#4a6fa5" },
            { icon: "calendar-month" as const, title: "Timeline", bg: "#8a6aaa" },
          ].map((page) => (
            <View
              key={page.title}
              style={[styles.buildBookPage, { backgroundColor: page.bg }]}
            >
              <MaterialCommunityIcons name={page.icon} size={26} color="#fff" style={{ marginBottom: 4 }} />
              <Text style={styles.buildBookPageTitle}>{page.title}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.buildBookBtn}>
          <Text style={styles.buildBookBtnText}>View Build Book</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { paddingBottom: 24 },

  /* Hero */
  hero: {
    backgroundColor: "#f8f7f4",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#2d5a3d",
    marginBottom: 8,
  },
  heroTitle: { fontSize: 30, fontWeight: "800", color: "#1a1a2e", lineHeight: 38 },
  heroSubtitle: { fontSize: 14, color: "#6a6a7a", marginTop: 10, lineHeight: 21 },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  primaryBtn: {
    backgroundColor: "#2d5a3d",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#d5d3cd",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  secondaryBtnText: { color: "#1a1a2e", fontWeight: "600", fontSize: 14 },

  /* Section headers */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  seeAll: { fontSize: 13, fontWeight: "600", color: "#2d5a3d" },

  /* Active Project */
  projectCard: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  projectCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  projectCardTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
  projectCardSub: { fontSize: 12, color: "#7a7a8a", marginTop: 2 },
  statusBadge: {
    backgroundColor: "#2d5a3d15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "600", color: "#2d5a3d" },
  progressSection: { marginBottom: 14 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: "#7a7a8a" },
  progressPercent: { fontSize: 12, fontWeight: "700", color: "#2d5a3d" },
  progressTrack: {
    height: 6,
    backgroundColor: "#f3f2ef",
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: "#2d5a3d",
    borderRadius: 3,
  },
  miniStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  miniStat: { flex: 1, alignItems: "center", paddingVertical: 6 },
  miniStatBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "#f3f2ef",
  },
  miniStatValue: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  miniStatLabel: { fontSize: 10, color: "#7a7a8a", marginTop: 2 },

  /* Quick Actions */
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 24,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 48 - 20) / 3,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: { fontSize: 11, fontWeight: "600", color: "#4a4a5a" },

  /* Trending */
  trendingScroll: { paddingLeft: 24 },

  /* Categories */
  categoryScroll: { marginTop: 10 },
  categoryContent: { paddingHorizontal: 24, gap: 8 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    backgroundColor: "#fff",
  },
  categoryPillText: { fontSize: 12, fontWeight: "500", color: "#4a4a5a" },

  /* Budget */
  budgetCard: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e8e6e1",
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  budgetTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  budgetBadge: {
    backgroundColor: "#2d5a3d15",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  budgetBadgeText: { fontSize: 10, fontWeight: "600", color: "#2d5a3d" },
  budgetSummary: { flexDirection: "row", gap: 8, marginBottom: 16 },
  budgetSummaryItem: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  budgetSummaryLabel: { fontSize: 10, color: "#7a7a8a" },
  budgetSummaryValue: { fontSize: 16, fontWeight: "700", color: "#1a1a2e", marginTop: 2 },
  budgetBarRow: { marginBottom: 10 },
  budgetBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  budgetBarLabel: { fontSize: 12, fontWeight: "500", color: "#4a4a5a" },
  budgetBarValue: { fontSize: 11, color: "#7a7a8a" },
  budgetBarTrack: { height: 7, backgroundColor: "#f3f2ef", borderRadius: 4 },
  budgetBarFill: { height: 7, borderRadius: 4 },
  pieRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f3f2ef",
    paddingTop: 14,
    gap: 16,
  },
  pieChart: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f3f2ef",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  pieSlice: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "50%",
    height: "50%",
    borderTopLeftRadius: 32,
  },
  pieCenter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  pieCenterText: { fontSize: 11, fontWeight: "700", color: "#1a1a2e" },
  pieLegend: { flex: 1, gap: 4 },
  pieLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  pieDot: { width: 8, height: 8, borderRadius: 4 },
  pieLegendText: { fontSize: 11, color: "#4a4a5a" },

  /* Timeline */
  timelineCard: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
  },
  timelineViewTabs: { flexDirection: "row", gap: 4, marginBottom: 12 },
  timelineTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  timelineTabActive: { backgroundColor: "#2d5a3d" },
  timelineTabText: { fontSize: 12, fontWeight: "600", color: "#7a7a8a" },
  timelineTabTextActive: { color: "#fff" },
  ganttMonths: { flexDirection: "row", marginBottom: 4 },
  ganttMonthRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ganttMonth: { fontSize: 10, color: "#9a9aaa" },
  ganttRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  ganttTask: { width: 90, fontSize: 11, color: "#4a4a5a" },
  ganttTrack: {
    flex: 1,
    height: 18,
    backgroundColor: "#f3f2ef",
    borderRadius: 4,
    position: "relative",
  },
  ganttBar: {
    position: "absolute",
    top: 0,
    height: 18,
    borderRadius: 4,
  },

  /* Kanban */
  kanbanColumn: {
    width: 155,
    marginLeft: 12,
    backgroundColor: "#fafaf8",
    borderRadius: 12,
    padding: 10,
  },
  kanbanHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  kanbanDot: { width: 8, height: 8, borderRadius: 4 },
  kanbanStatus: { fontSize: 12, fontWeight: "600", color: "#4a4a5a" },
  kanbanCount: { fontSize: 10, color: "#9a9aaa" },
  kanbanTask: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e8e6e1",
  },
  kanbanTaskText: { fontSize: 11, color: "#4a4a5a" },

  /* Professionals */
  proCard: {
    width: 150,
    marginLeft: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    alignItems: "center",
  },
  proAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  proAvatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  proName: { fontSize: 13, fontWeight: "700", color: "#1a1a2e" },
  proRole: { fontSize: 10, color: "#7a7a8a", marginTop: 2 },
  proRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
  },
  proRatingText: { fontSize: 12, fontWeight: "600", color: "#1a1a2e" },
  proReviews: { fontSize: 10, color: "#7a7a8a" },
  proBadges: { flexDirection: "row", gap: 4, marginTop: 8 },
  proBadge: {
    fontSize: 9,
    color: "#6a6a7a",
    backgroundColor: "#f8f7f4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  /* AI Design */
  designCard: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e8e6e1",
  },
  designPreview: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#dce8d4",
    height: 200,
  },
  designPreviewInner: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
    backgroundColor: "#c5d4bc80",
  },
  designPreviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  designDimension: {
    backgroundColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  designDimensionText: { fontSize: 11, fontWeight: "500", color: "#4a4a5a" },
  designPreviewBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  designGhost: {
    width: 56,
    height: 40,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    borderStyle: "dashed",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginRight: 8,
  },
  addFurnitureBtn: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFurnitureBtnText: { fontSize: 12, fontWeight: "600", color: "#2d5a3d" },
  furnitureSlider: { marginTop: 10 },
  furnitureItem: {
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    padding: 8,
    alignItems: "center",
    width: 80,
  },
  furnitureSwatch: { width: 56, height: 38, borderRadius: 6, marginBottom: 6 },
  furnitureName: { fontSize: 10, fontWeight: "600", color: "#4a4a5a" },
  furniturePrice: { fontSize: 10, color: "#2d5a3d", marginTop: 2 },
  designToggle: {
    flexDirection: "row",
    marginTop: 10,
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "center",
  },
  designToggleActive: {
    backgroundColor: "#2d5a3d",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  designToggleActiveText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  designToggleInactive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  designToggleInactiveText: { color: "#7a7a8a", fontSize: 12, fontWeight: "600" },

  /* Build Book CTA */
  buildBookCta: {
    marginHorizontal: 24,
    marginTop: 28,
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  buildBookLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#bde0c0",
    marginBottom: 8,
  },
  buildBookTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  buildBookDesc: {
    fontSize: 13,
    color: "#9a9ab0",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  buildBookPages: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  buildBookPage: {
    width: 68,
    height: 88,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buildBookPageTitle: { fontSize: 9, fontWeight: "600", color: "#fff" },
  buildBookBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buildBookBtnText: { fontSize: 13, fontWeight: "700", color: "#1a1a2e" },
});
