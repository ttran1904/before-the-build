import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DesignStyle, ProjectGoal } from "@before-the-build/shared";
import type { BathroomSize } from "@/lib/room-sizes/bathroom";
import type { PriceOverride } from "@/lib/budget-engine/budget-graph";
import type { PointedItem, Product } from "@/lib/moodboard/types";

/* ── Bathroom Wizard State ── */

export type BathroomScope = "cosmetic" | "partial" | "full" | "addition";
export type BudgetTier = "basic" | "mid" | "high";

/** Fields accepted by the setDimensions batch setter */
export type DimensionFields = {
  roomWidth: string; roomWidthIn: string; roomWidthM: string;
  roomLength: string; roomLengthIn: string; roomLengthM: string;
  roomHeight: string; roomHeightIn: string; roomHeightM: string;
  showerWidth: string; showerWidthIn: string; showerWidthM: string;
  showerLength: string; showerLengthIn: string; showerLengthM: string;
  measurementUnit: "ft" | "m";
};

export interface BathroomWizardState {
  // Step 1: Goal (multi-select)
  goals: string[];
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
  // Meter mirrors (pre-computed for instant unit toggle)
  roomWidthM: string;
  roomLengthM: string;
  roomHeightM: string;
  showerWidthM: string;
  showerLengthM: string;
  measurementUnit: "ft" | "m";
  currentStep: number;
  // Price overrides from moodboard selections
  priceOverrides: PriceOverride[];
  // Moodboard discovery state (persisted across navigation / hot reloads)
  moodboardPointedItems: Record<string, PointedItem[]>;
  moodboardManualProducts: Product[];
  moodboardDragPositions: Record<number, { x: number; y: number }>;
  // Real Mockup state
  mockupBathroomPhotos: string[]; // base64 data URLs of uploaded bathroom photos
  mockupGeneratedImages: string[]; // URLs of AI-generated mockup images
  mockupLoading: boolean;
}

interface WizardActions {
  toggleGoal: (goal: string) => void;
  setScope: (scope: BathroomScope) => void;
  setMustHaves: (items: string[]) => void;
  setNiceToHaves: (items: string[]) => void;
  setBudgetTier: (tier: BudgetTier) => void;
  setBudgetAmount: (amount: number) => void;
  setBudgetAmounts: (tier: BudgetTier, amount: number | null) => void;
  setStyle: (style: DesignStyle) => void;
  setBathroomSize: (size: BathroomSize) => void;
  setRoomWidth: (w: string) => void;
  setRoomWidthIn: (w: string) => void;
  setRoomLength: (l: string) => void;
  setRoomLengthIn: (l: string) => void;
  setRoomHeight: (h: string) => void;
  setRoomHeightIn: (h: string) => void;
  setShowerWidth: (w: string) => void;
  setShowerWidthIn: (w: string) => void;
  setShowerLength: (l: string) => void;
  setShowerLengthIn: (l: string) => void;
  setMeasurementUnit: (unit: "ft" | "m") => void;
  /** Batch-set any combination of dimension + unit fields in a single re-render */
  setDimensions: (dims: Partial<DimensionFields>) => void;
  setCurrentStep: (step: number) => void;
  setPriceOverride: (override: PriceOverride) => void;
  removePriceOverride: (itemLabel: string) => void;
  setMoodboardPointedItems: (updater: Record<string, PointedItem[]> | ((prev: Record<string, PointedItem[]>) => Record<string, PointedItem[]>)) => void;
  setMoodboardManualProducts: (updater: Product[] | ((prev: Product[]) => Product[])) => void;
  setMoodboardDragPositions: (updater: Record<number, { x: number; y: number }> | ((prev: Record<number, { x: number; y: number }>) => Record<number, { x: number; y: number }>)) => void;
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
  moodboardDragPositions: {},
  mockupBathroomPhotos: [],
  mockupGeneratedImages: [],
  mockupLoading: false,
};

export const useWizardStore = create<BathroomWizardState & WizardActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      toggleGoal: (goal) => set((state) => ({
        goals: state.goals.includes(goal)
          ? state.goals.filter((g) => g !== goal)
          : [...state.goals, goal],
      })),
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
      setRoomWidth: (roomWidth) => set({ roomWidth }),
      setRoomWidthIn: (roomWidthIn) => set({ roomWidthIn }),
      setRoomLength: (roomLength) => set({ roomLength }),
      setRoomLengthIn: (roomLengthIn) => set({ roomLengthIn }),
      setRoomHeight: (roomHeight) => set({ roomHeight }),
      setRoomHeightIn: (roomHeightIn) => set({ roomHeightIn }),
      setShowerWidth: (showerWidth) => set({ showerWidth }),
      setShowerWidthIn: (showerWidthIn) => set({ showerWidthIn }),
      setShowerLength: (showerLength) => set({ showerLength }),
      setShowerLengthIn: (showerLengthIn) => set({ showerLengthIn }),
      setMeasurementUnit: (measurementUnit) => set({ measurementUnit }),
      setDimensions: (dims) => set(dims),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setPriceOverride: (override) => set((state) => ({
        priceOverrides: [
          ...state.priceOverrides.filter((o) => o.itemLabel !== override.itemLabel),
          override,
        ],
      })),
      removePriceOverride: (itemLabel) => set((state) => ({
        priceOverrides: state.priceOverrides.filter((o) => o.itemLabel !== itemLabel),
      })),
      setMoodboardPointedItems: (updater) => set((state) => ({
        moodboardPointedItems: typeof updater === "function" ? updater(state.moodboardPointedItems) : updater,
      })),
      setMoodboardManualProducts: (updater) => set((state) => ({
        moodboardManualProducts: typeof updater === "function" ? updater(state.moodboardManualProducts) : updater,
      })),
      setMoodboardDragPositions: (updater) => set((state) => ({
        moodboardDragPositions: typeof updater === "function" ? updater(state.moodboardDragPositions) : updater,
      })),
      addMockupPhoto: (dataUrl) => set((state) => ({
        mockupBathroomPhotos: [...state.mockupBathroomPhotos, dataUrl],
      })),
      removeMockupPhoto: (index) => set((state) => ({
        mockupBathroomPhotos: state.mockupBathroomPhotos.filter((_, i) => i !== index),
      })),
      setMockupGeneratedImages: (images) => set({ mockupGeneratedImages: images }),
      setMockupLoading: (loading) => set({ mockupLoading: loading }),
      reset: () => set(initialState),
    }),
    {
      name: "btb-wizard-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/* ── Idea Board State (Multi-Board) ── */

export interface IdeaBoardItem {
  id: string;
  imageUrl: string;
  sourceUrl?: string;
  source: string;
  tags: string[];
  title?: string;
  saved: boolean;
  boardIds: string[];
}

export interface IdeaBoard {
  id: string;
  name: string;
  createdAt: number;
  source?: string;
}

interface IdeaBoardState {
  items: IdeaBoardItem[];
  boards: IdeaBoard[];
  addItem: (item: IdeaBoardItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: IdeaBoardItem) => void;
  createBoard: (name: string, source?: string) => string;
  removeBoard: (boardId: string) => void;
  renameBoard: (boardId: string, name: string) => void;
  saveItemToBoard: (item: Omit<IdeaBoardItem, "boardIds" | "saved">, boardId: string) => void;
  removeItemFromBoard: (itemId: string, boardId: string) => void;
  getItemBoards: (itemId: string) => string[];
  getBoardItems: (boardId: string) => IdeaBoardItem[];
  getSuggestedBoardNames: (tags: string[]) => string[];
}

let boardCounter = 0;

export const useIdeaBoardStore = create<IdeaBoardState>()(
  persist(
    (set, get) => ({
      items: [],
      boards: [],

  addItem: (item) => set({ items: [...get().items, { ...item, saved: true }] }),
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

  toggleItem: (item) => {
    const exists = get().items.find((i) => i.id === item.id);
    if (exists) {
      set({ items: get().items.filter((i) => i.id !== item.id) });
    } else {
      set({ items: [...get().items, { ...item, boardIds: item.boardIds || [], saved: true }] });
    }
  },

  createBoard: (name: string, source?: string) => {
    const id = `board_${Date.now()}_${++boardCounter}`;
    const board: IdeaBoard = { id, name, createdAt: Date.now(), ...(source ? { source } : {}) };
    set({ boards: [...get().boards, board] });
    return id;
  },

  removeBoard: (boardId: string) => {
    set({
      boards: get().boards.filter((b) => b.id !== boardId),
      items: get().items
        .map((item) => ({
          ...item,
          boardIds: item.boardIds.filter((bid) => bid !== boardId),
        }))
        .filter((item) => item.boardIds.length > 0),
    });
  },

  renameBoard: (boardId: string, name: string) => {
    set({
      boards: get().boards.map((b) => (b.id === boardId ? { ...b, name } : b)),
    });
  },

  saveItemToBoard: (item, boardId) => {
    const existing = get().items.find((i) => i.id === item.id);
    if (existing) {
      if (!existing.boardIds.includes(boardId)) {
        set({
          items: get().items.map((i) =>
            i.id === item.id ? { ...i, boardIds: [...i.boardIds, boardId] } : i
          ),
        });
      }
    } else {
      set({
        items: [...get().items, { ...item, boardIds: [boardId], saved: true }],
      });
    }
  },

  removeItemFromBoard: (itemId, boardId) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return;
    const newBoardIds = item.boardIds.filter((bid) => bid !== boardId);
    if (newBoardIds.length === 0) {
      set({ items: get().items.filter((i) => i.id !== itemId) });
    } else {
      set({
        items: get().items.map((i) =>
          i.id === itemId ? { ...i, boardIds: newBoardIds } : i
        ),
      });
    }
  },

  getItemBoards: (itemId) => {
    return get().items.find((i) => i.id === itemId)?.boardIds || [];
  },

  getBoardItems: (boardId) => {
    return get().items.filter((i) => i.boardIds.includes(boardId));
  },

  getSuggestedBoardNames: (tags: string[]) => {
    const suggestions: string[] = [];
    const styleTags = tags.filter((t) =>
      ["modern", "farmhouse", "coastal", "spa", "minimalist", "industrial",
       "scandinavian", "bohemian", "mid-century", "traditional", "japandi", "art deco"].some(
        (s) => t.toLowerCase().includes(s)
      )
    );
    const roomTags = tags.filter((t) =>
      ["bathroom", "kitchen", "bedroom", "living"].some((r) => t.toLowerCase().includes(r))
    );

    if (styleTags.length > 0 && roomTags.length > 0) {
      const style = styleTags[0].charAt(0).toUpperCase() + styleTags[0].slice(1);
      const room = roomTags[0].charAt(0).toUpperCase() + roomTags[0].slice(1);
      suggestions.push(`${style} ${room.toLowerCase()} decor`);
    }

    if (roomTags.length > 0) {
      const room = roomTags[0].charAt(0).toUpperCase() + roomTags[0].slice(1);
      suggestions.push(`${room} decor idea`);
      suggestions.push(`${room} decor`);
    }

    if (styleTags.length > 0) {
      const style = styleTags[0].charAt(0).toUpperCase() + styleTags[0].slice(1);
      suggestions.push(`${style} decor ideas`);
    }

    if (suggestions.length === 0) {
      suggestions.push("Design inspiration", "Decor ideas", "Room makeover");
    }

    return suggestions.slice(0, 3);
  },
    }),
    {
      name: "btb-moodboard-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
