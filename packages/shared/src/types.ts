// ============================================================
// Before The Build — Shared Type Definitions
// ============================================================

// ---- Enums / Unions ----

export type RoomType =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "living_room"
  | "dining_room"
  | "garage"
  | "basement"
  | "office"
  | "outdoor"
  | "other";

export type ProjectStatus = "onboarding" | "planning" | "designing" | "reviewing" | "completed";

export type ProjectGoal =
  | "increase_home_value"
  | "more_living_space"
  | "energy_efficient"
  | "modernize"
  | "child_friendly"
  | "accessibility"
  | "other";

export type DesignStyle =
  | "modern"
  | "minimalist"
  | "industrial"
  | "scandinavian"
  | "bohemian"
  | "mid_century_modern"
  | "farmhouse"
  | "traditional"
  | "coastal"
  | "japandi"
  | "art_deco"
  | "other";

export type InspirationSource =
  | "pinterest"
  | "instagram"
  | "google"
  | "etsy"
  | "house_tour"
  | "resort"
  | "magazine"
  | "upload";

export type ChatMessageRole = "user" | "assistant";

export type FurnitureCategory =
  | "seating"
  | "tables"
  | "storage"
  | "lighting"
  | "decor"
  | "rugs"
  | "window_treatments"
  | "appliances"
  | "fixtures"
  | "other";

// ---- Core Models ----

export interface HouseholdProfile {
  id: string;
  projectId: string;
  adults: number;
  children: number;
  pets: PetInfo[];
  habits: string[];
  specialNeeds?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PetInfo {
  type: "dog" | "cat" | "bird" | "fish" | "reptile" | "other";
  count: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  goals: ProjectGoal[];
  mustHaves: string[];
  niceToHaves: string[];
  budget?: number;
  preferredStyles: DesignStyle[];
  household?: HouseholdProfile;
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  projectId: string;
  name: string;
  type: RoomType;
  dimensions?: RoomDimensions;
  scanData?: RoomScanData;
  photos: string[];
  existingFurniture: FurnitureItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomDimensions {
  width: number;
  height: number;
  length: number;
  unit: "ft" | "m";
}

export interface RoomScanData {
  /** Raw data from Apple Room API or similar */
  meshUrl?: string;
  floorPlanUrl?: string;
  anchorPoints: AnchorPoint[];
  scannedAt: string;
}

export interface AnchorPoint {
  x: number;
  y: number;
  z: number;
  label?: string;
}

// ---- Inspiration & Mood Board ----

export interface InspirationItem {
  id: string;
  projectId: string;
  source: InspirationSource;
  imageUrl: string;
  sourceUrl?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export interface MoodBoard {
  id: string;
  projectId: string;
  name: string;
  items: InspirationItem[];
  createdAt: string;
  updatedAt: string;
}

// ---- Furniture & Products ----

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  brand?: string;
  price?: number;
  imageUrl?: string;
  productUrl?: string;
  dimensions?: { width: number; height: number; depth: number };
  isExisting: boolean;
}

// ---- Design ----

export interface DesignSuggestion {
  id: string;
  roomId: string;
  style: DesignStyle;
  description: string;
  estimatedCost: number;
  furnitureItems: FurnitureItem[];
  imageUrl?: string;
  createdAt: string;
}

export interface RoomDesign {
  id: string;
  roomId: string;
  projectId: string;
  name: string;
  /** JSON representation of the 2D layout for the canvas renderer */
  layout2D: object;
  /** JSON representation of the 3D scene for the 3D renderer */
  layout3D?: object;
  placedItems: PlacedItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PlacedItem {
  furnitureItemId: string;
  position: { x: number; y: number; z?: number };
  rotation: number;
  scale?: number;
}

// ---- AI Chat ----

export interface ChatMessage {
  id: string;
  roomDesignId: string;
  role: ChatMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  roomDesignId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ---- Build Book (Final Review) ----

export interface BuildBook {
  id: string;
  projectId: string;
  scopeDescription: string;
  rooms: BuildBookRoom[];
  totalEstimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuildBookRoom {
  roomId: string;
  roomName: string;
  layout2DUrl: string;
  layout3DUrl?: string;
  itemsList: FurnitureItem[];
  roomEstimatedCost: number;
  notes?: string;
}

// ---- Onboarding Flow ----

export type OnboardingStep =
  | "household_info"
  | "areas_of_interest"
  | "explore_styles"
  | "set_goals"
  | "scan_rooms";

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  projectId?: string;
}

// ---- Navigation ----

export type AppTab = "home" | "explore" | "design" | "chat" | "review";
