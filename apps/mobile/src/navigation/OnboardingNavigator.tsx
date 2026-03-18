import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HouseholdInfoScreen } from "../screens/onboarding/HouseholdInfoScreen";
import { AreasOfInterestScreen } from "../screens/onboarding/AreasOfInterestScreen";
import { ExploreStylesScreen } from "../screens/onboarding/ExploreStylesScreen";
import { SetGoalsScreen } from "../screens/onboarding/SetGoalsScreen";
import { ScanRoomsScreen } from "../screens/onboarding/ScanRoomsScreen";

export type OnboardingStackParamList = {
  HouseholdInfo: undefined;
  AreasOfInterest: undefined;
  ExploreStyles: undefined;
  SetGoals: undefined;
  ScanRooms: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#1a1a2e",
      }}
    >
      <Stack.Screen
        name="HouseholdInfo"
        component={HouseholdInfoScreen}
        options={{ title: "About Your Household" }}
      />
      <Stack.Screen
        name="AreasOfInterest"
        component={AreasOfInterestScreen}
        options={{ title: "Areas to Change" }}
      />
      <Stack.Screen
        name="ExploreStyles"
        component={ExploreStylesScreen}
        options={{ title: "Explore Styles" }}
      />
      <Stack.Screen
        name="SetGoals"
        component={SetGoalsScreen}
        options={{ title: "Set Your Goals" }}
      />
      <Stack.Screen
        name="ScanRooms"
        component={ScanRoomsScreen}
        options={{ title: "Scan Your Rooms" }}
      />
    </Stack.Navigator>
  );
}
