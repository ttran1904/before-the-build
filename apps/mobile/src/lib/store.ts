import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DesignStyle } from "@before-the-build/shared";
import type { BathroomSize } from "@before-the-build/shared";
import type { PriceOverride, PointedItem, Product } from "@before-the-build/shared";

/* ── Bathroom Wizard State ── */

export type BathroomScope = "cosmetic" | "partial" | "full" | "addition";
export type BudgetTier = "basic" | "mid" | "high";

export interface BathroomWizardState {
  goals: string[];
  scope: BathroomScope | null;
  mustHaves: string[];
  niceToHaves: string[];
  budgetTier: BudgetTier | null;
  budgetAmount: number | null;
  budgetAmounts: Record<BudgetTier, number | null>;
  style: DesignStyle | null;
  bathroomSize: BathroomSize;
  roomWidth: string;
  roomWidthIn: string;
  roomLength: string;
  roomLengthIn: string;
  roomHeight: string;
  roomHeightIn: string;
  showerWidth: string;
  showerWidthIn: string;
  showerLength: string;
  showerLengthIn: string;
  roomWidthM: string;
  roomLengthM: string;
  roomHeightM: string;
  showerWidthM: string;
  showerLengthM: string;
  measurementUnit: "ft" | "m";
  currentStep: number;
  priceOverrides: PriceOverride[];
  moodboardPointedItems: Record<string, PointedItem[]>;
  moodboardManualProducts: Product[];
  mockupBathroomPhotos: string[];
  mockupGeneratedImages: string[];
  mockupLoading: boolean;
}

interface WizardActions {
  toggleGoal: (goal: string) => void;
  setScope: (scope: BathroomScope) => void;
  setMustHaves: (items: string[]) => void;
  setNiceToHaves: (items: string[]) => void;
  setBudgetTier: (tier: BudgetTier) => void;
  setBudgetAmount: (amount: number) => void;
  setStyle: (style: DesignStyle) => void;
  setBathroomSize: (size: BathroomSize) => void;
  setCurrentStep: (step: number) => void;
  setPriceOverride: (override: PriceOverride) => void;
  removePriceOverride: (itemLabel: string) => void;
  addMockupPhoto: (dataUrl: string) => void;
  removeMockupPhoto: (index: number) => void;
  setMockupGeneratedImages: (images: string[]) => void;
  setMockupLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState: BathroomWizardState = {
  goals: [],
  scope: null,
  mustHaves: [],
  niceToHaves: [],
  budgetTier: null,
  budgetAmount: null,
  budgetAmounts: { basic: null, mid: null, high: null },
  style: null,
  bathroomSize: "full-bath",
  roomWidth: "",
  roomWidthIn: "",
  roomLength: "",
  roomLengthIn: "",
  roomHeight: "",
  roomHeightIn: "",
  showerWidth: "",
  showerWidthIn: "",
  showerLength: "",
  showerLengthIn: "",
  roomWidthM: "",
  roomLengthM: "",
  roomHeightM: "",
  showerWidthM: "",
  showerLengthM: "",
  measurementUnit: "ft" as const,
  currentStep: 0,
  priceOverrides: [],
  moodboardPointedItems: {},
  moodboardManualProducts: [],
  mockupBathroomPhotos: [],
  mockupGeneratedImages: [],
  mockupLoading: false,
};

export const useWizardStore = create<BathroomWizardState & WizardActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      toggleGoal: (goal) =>
        set((s) => ({
          goals: s.goals.includes(goal)
            ? s.goals.filter((g) => g !== goal)
            : [...s.goals, goal],
        })),
      setScope: (scope) => set({ scope }),
      setMustHaves: (mustHaves) => set({ mustHaves }),
      setNiceToHaves: (niceToHaves) => set({ niceToHaves }),
      setBudgetTier: (budgetTier) =>
        set((s) => ({ budgetTier, budgetAmount: s.budgetAmounts[budgetTier] })),
      setBudgetAmount: (budgetAmount) => set({ budgetAmount }),
      setStyle: (style) => set({ style }),
      setBathroomSize: (bathroomSize) => set({ bathroomSize }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setPriceOverride: (override) =>
        set((s) => ({
          priceOverrides: [
            ...s.priceOverrides.filter((o) => o.itemLabel !== override.itemLabel),
            override,
          ],
        })),
      removePriceOverride: (itemLabel) =>
        set((s) => ({
          priceOverrides: s.priceOverrides.filter((o) => o.itemLabel !== itemLabel),
        })),
      addMockupPhoto: (dataUrl) =>
        set((s) => ({ mockupBathroomPhotos: [...s.mockupBathroomPhotos, dataUrl] })),
      removeMockupPhoto: (index) =>
        set((s) => ({
          mockupBathroomPhotos: s.mockupBathroomPhotos.filter((_, i) => i !== index),
        })),
      setMockupGeneratedImages: (images) => set({ mockupGeneratedImages: images }),
      setMockupLoading: (loading) => set({ mockupLoading: loading }),
      reset: () => set(initialState),
    }),
    {
      name: "btb-wizard-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
