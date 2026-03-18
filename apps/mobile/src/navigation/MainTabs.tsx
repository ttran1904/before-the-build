import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/main/HomeScreen";
import { ExploreScreen } from "../screens/main/ExploreScreen";
import { DesignScreen } from "../screens/main/DesignScreen";
import { ChatScreen } from "../screens/main/ChatScreen";
import { BuildBookScreen } from "../screens/main/BuildBookScreen";

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Design: undefined;
  Chat: undefined;
  BuildBook: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  Explore: "compass-outline",
  Design: "cube-outline",
  Chat: "chatbubble-outline",
  BuildBook: "book-outline",
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: "#1a1a2e",
        tabBarInactiveTintColor: "#999",
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#1a1a2e",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: "Explore" }} />
      <Tab.Screen name="Design" component={DesignScreen} options={{ title: "Design" }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: "AI Chat" }} />
      <Tab.Screen
        name="BuildBook"
        component={BuildBookScreen}
        options={{ title: "Build Book" }}
      />
    </Tab.Navigator>
  );
}
