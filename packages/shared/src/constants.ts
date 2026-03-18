// ============================================================
// Before The Build — Shared Constants
// ============================================================

import type {
  RoomType,
  ProjectGoal,
  DesignStyle,
  InspirationSource,
  FurnitureCategory,
  OnboardingStep,
  AppTab,
} from "./types";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  living_room: "Living Room",
  dining_room: "Dining Room",
  garage: "Garage",
  basement: "Basement",
  office: "Office",
  outdoor: "Outdoor",
  other: "Other",
};

export const PROJECT_GOAL_LABELS: Record<ProjectGoal, string> = {
  increase_home_value: "Increase Home Value",
  more_living_space: "Create More Living Space",
  energy_efficient: "Make It Energy Efficient",
  modernize: "Modernize the Space",
  child_friendly: "Make It Child-Friendly",
  accessibility: "Improve Accessibility",
  other: "Other",
};

export const DESIGN_STYLE_LABELS: Record<DesignStyle, string> = {
  modern: "Modern",
  minimalist: "Minimalist",
  industrial: "Industrial",
  scandinavian: "Scandinavian",
  bohemian: "Bohemian",
  mid_century_modern: "Mid-Century Modern",
  farmhouse: "Farmhouse",
  traditional: "Traditional",
  coastal: "Coastal",
  japandi: "Japandi",
  art_deco: "Art Deco",
  other: "Other",
};

export const INSPIRATION_SOURCE_LABELS: Record<InspirationSource, string> = {
  pinterest: "Pinterest",
  instagram: "Instagram",
  google: "Google Images",
  etsy: "Etsy",
  house_tour: "House Tours",
  resort: "Resorts",
  magazine: "Magazines",
  upload: "My Upload",
};

export const FURNITURE_CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  seating: "Seating",
  tables: "Tables",
  storage: "Storage",
  lighting: "Lighting",
  decor: "Decor",
  rugs: "Rugs & Carpets",
  window_treatments: "Window Treatments",
  appliances: "Appliances",
  fixtures: "Fixtures",
  other: "Other",
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "household_info",
  "areas_of_interest",
  "explore_styles",
  "set_goals",
  "scan_rooms",
];

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  household_info: "About Your Household",
  areas_of_interest: "Areas to Change",
  explore_styles: "Explore Styles",
  set_goals: "Set Your Goals",
  scan_rooms: "Scan Your Rooms",
};

export const APP_TABS: AppTab[] = ["home", "explore", "design", "chat", "review"];

export const APP_TAB_LABELS: Record<AppTab, string> = {
  home: "Home",
  explore: "Explore",
  design: "Design",
  chat: "AI Chat",
  review: "Build Book",
};
