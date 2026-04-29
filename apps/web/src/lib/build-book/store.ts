"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ── Build Book draft ──────────────────────────────────────────
 * Standalone design-intake store, independent from the legacy
 * useWizardStore. The new Build Book wizard writes here; the
 * existing /build-book deliverable + downstream tools (catalogue,
 * moodboard, mockup) can read from here as we migrate them.
 * ────────────────────────────────────────────────────────────── */

export type ItemSource = "ideas" | "catalogue" | "shopping";

export interface BuildBookBathroomState {
  // Style tab
  styles: string[];
  inspirationLinks: string;

  // Items tab
  itemSource: ItemSource | null;

  // Visualize tab
  photos: string[];

  // Bookkeeping
  completedAt: string | null;
}

interface Actions {
  set: <K extends keyof BuildBookBathroomState>(
    key: K,
    value: BuildBookBathroomState[K]
  ) => void;
  reset: () => void;
  markComplete: () => void;
}

const initial: BuildBookBathroomState = {
  styles: [],
  inspirationLinks: "",
  itemSource: null,
  photos: [],
  completedAt: null,
};

export const useBuildBookStore = create<BuildBookBathroomState & Actions>()(
  persist(
    (set) => ({
      ...initial,
      set: (key, value) =>
        set({ [key]: value } as Partial<BuildBookBathroomState>),
      reset: () => set({ ...initial }),
      markComplete: () => set({ completedAt: new Date().toISOString() }),
    }),
    {
      name: "btb:buildbook:bathroom",
      storage: createJSONStorage(() => localStorage),
    }
  )
);