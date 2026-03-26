import { create } from "zustand";
import type { DesignStyle, ProjectGoal } from "@before-the-build/shared";
import type { BathroomSize } from "@/lib/room-sizes/bathroom";

/* ── Bathroom Wizard State ── */

export type BathroomScope = "cosmetic" | "partial" | "full" | "addition";
export type BudgetTier = "basic" | "mid" | "high";

export interface BathroomWizardState {
  // Step 1: Goal
  goal: string;
  // Step 2: Scope
  scope: BathroomScope | null;
  // Step 3: Must-haves & Nice-to-haves
  mustHaves: string[];
  niceToHaves: string[];
  // Step 4: Budget
  budgetTier: BudgetTier | null;
  budgetAmount: number | null;
  budgetAmounts: Record<BudgetTier, number | null>;
  // Step 5: Style
  style: DesignStyle | null;
  // Metadata
  bathroomSize: BathroomSize;
  currentStep: number;
}

interface WizardActions {
  setGoal: (goal: string) => void;
  setScope: (scope: BathroomScope) => void;
  setMustHaves: (items: string[]) => void;
  setNiceToHaves: (items: string[]) => void;
  setBudgetTier: (tier: BudgetTier) => void;
  setBudgetAmount: (amount: number) => void;
  setBudgetAmounts: (tier: BudgetTier, amount: number | null) => void;
  setStyle: (style: DesignStyle) => void;
  setBathroomSize: (size: BathroomSize) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

const initialState: BathroomWizardState = {
  goal: "",
  scope: null,
  mustHaves: [],
  niceToHaves: [],
  budgetTier: null,
  budgetAmount: null,
  budgetAmounts: { basic: null, mid: null, high: null },
  style: null,
  bathroomSize: "full-bath",
  currentStep: 0,
};

export const useWizardStore = create<BathroomWizardState & WizardActions>((set) => ({
  ...initialState,
  setGoal: (goal) => set({ goal }),
  setScope: (scope) => set({ scope }),
  setMustHaves: (mustHaves) => set({ mustHaves }),
  setNiceToHaves: (niceToHaves) => set({ niceToHaves }),
  setBudgetTier: (budgetTier) => set((state) => ({ budgetTier, budgetAmount: state.budgetAmounts[budgetTier] })),
  setBudgetAmount: (budgetAmount) => set({ budgetAmount }),
  setBudgetAmounts: (tier, amount) => set((state) => ({
    budgetAmounts: { ...state.budgetAmounts, [tier]: amount },
    ...(state.budgetTier === tier ? { budgetAmount: amount } : {}),
  })),
  setStyle: (style) => set({ style }),
  setBathroomSize: (bathroomSize) => set({ bathroomSize }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  reset: () => set(initialState),
}));

/* ── Moodboard State ── */

export interface MoodboardItem {
  id: string;
  imageUrl: string;
  sourceUrl?: string;
  source: string;
  tags: string[];
  title?: string;
  saved: boolean;
}

interface MoodboardState {
  items: MoodboardItem[];
  addItem: (item: MoodboardItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: MoodboardItem) => void;
}

export const useMoodboardStore = create<MoodboardState>((set, get) => ({
  items: [],
  addItem: (item) => set({ items: [...get().items, { ...item, saved: true }] }),
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  toggleItem: (item) => {
    const exists = get().items.find((i) => i.id === item.id);
    if (exists) {
      set({ items: get().items.filter((i) => i.id !== item.id) });
    } else {
      set({ items: [...get().items, { ...item, saved: true }] });
    }
  },
}));
