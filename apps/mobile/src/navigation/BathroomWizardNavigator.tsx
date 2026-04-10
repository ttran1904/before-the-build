import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GoalsScreen from "../screens/renovate/GoalsScreen";
import MustHavesScreen from "../screens/renovate/MustHavesScreen";
import BudgetScreen from "../screens/renovate/BudgetScreen";
import ItemsPicturesScreen from "../screens/renovate/ItemsPicturesScreen";
import CatalogueScreen from "../screens/renovate/CatalogueScreen";
import MoodboardScreen from "../screens/renovate/MoodboardScreen";
import MockupScreen from "../screens/renovate/MockupScreen";
import TimelineScreen from "../screens/renovate/TimelineScreen";
import ContractorScreen from "../screens/renovate/ContractorScreen";
import SummaryScreen from "../screens/renovate/SummaryScreen";
import { colors, fontSize } from "../lib/theme";

export type BathroomWizardParamList = {
  Goals: undefined;
  MustHaves: undefined;
  Budget: undefined;
  ItemsPictures: undefined;
  Catalogue: undefined;
  Moodboard: undefined;
  Mockup: undefined;
  Timeline: undefined;
  Contractor: undefined;
  Summary: undefined;
};

const Stack = createNativeStackNavigator<BathroomWizardParamList>();

export function BathroomWizardNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontSize: fontSize.md, fontWeight: "600" },
        headerBackTitleVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.white },
      }}
    >
      <Stack.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ title: "Goals & Scope" }}
      />
      <Stack.Screen
        name="MustHaves"
        component={MustHavesScreen}
        options={{ title: "Must-Haves" }}
      />
      <Stack.Screen
        name="Budget"
        component={BudgetScreen}
        options={{ title: "Budget" }}
      />
      <Stack.Screen
        name="ItemsPictures"
        component={ItemsPicturesScreen}
        options={{ title: "Items from Pictures" }}
      />
      <Stack.Screen
        name="Catalogue"
        component={CatalogueScreen}
        options={{ title: "Catalogue" }}
      />
      <Stack.Screen
        name="Moodboard"
        component={MoodboardScreen}
        options={{ title: "Moodboard" }}
      />
      <Stack.Screen
        name="Mockup"
        component={MockupScreen}
        options={{ title: "AI Mockup" }}
      />
      <Stack.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{ title: "Timeline" }}
      />
      <Stack.Screen
        name="Contractor"
        component={ContractorScreen}
        options={{ title: "Find Contractors" }}
      />
      <Stack.Screen
        name="Summary"
        component={SummaryScreen}
        options={{ title: "Summary" }}
      />
    </Stack.Navigator>
  );
}
