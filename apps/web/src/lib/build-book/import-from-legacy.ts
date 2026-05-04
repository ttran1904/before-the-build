"use client";

import type { BathroomWizardState } from "@/lib/store";
import {
  useBuildBookStore,
  type BuildBookBathroomState,
} from "@/lib/build-book/store";

/** Mirror legacy useWizardStore design fields (style, mockup photos)
 *  into the new Build Book store so saved projects open populated. */
export function importLegacyProjectIntoBuildBook(
  legacy: Partial<BathroomWizardState>
): BuildBookBathroomState {
  const styles = legacy.style ? [legacy.style] : [];

  const next: BuildBookBathroomState = {
    styles,
    inspirationLinks: "",
    itemSource: null,
    photos: legacy.mockupBathroomPhotos ?? [],
    completedAt: null,
    projectId: null,
  };

  useBuildBookStore.setState(next);
  return next;
}