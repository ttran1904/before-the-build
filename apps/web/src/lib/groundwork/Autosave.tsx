"use client";

import { useEffect, useRef } from "react";
import { useGroundworkStore, type GroundworkBathroomState } from "@/lib/groundwork/store";
import { saveGroundworkScope, groundworkHasContent } from "@/lib/groundwork/sync";

function signatureOf(s: GroundworkBathroomState): string {
  return JSON.stringify({
    projectType: s.projectType,
    bathroomKind: s.bathroomKind,
    goals: s.goals,
    urgency: s.urgency,
    budgetTier: s.budgetTier,
    vanity: s.vanity,
    toilet: s.toilet,
    showerTub: s.showerTub,
    flooring: s.flooring,
    walls: s.walls,
    lighting: s.lighting,
    electrical: s.electrical,
    layout: s.layout,
    notes: s.notes,
    photos: s.photos,
    floorPlan: s.floorPlan,
    completedAt: s.completedAt,
  });
}

export function GroundworkAutosave() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const lastSavedSig = useRef<string | null>(null);

  useEffect(() => {
    lastSavedSig.current = signatureOf(useGroundworkStore.getState());

    const trigger = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        if (inFlight.current) return;
        const state = useGroundworkStore.getState();
        if (!groundworkHasContent(state)) return;

        const sig = signatureOf(state);
        if (sig === lastSavedSig.current) return;

        inFlight.current = true;
        try {
          const result = await saveGroundworkScope(state, state.projectId);
          if (result) {
            lastSavedSig.current = sig;
            // Bind the local draft to its server row so subsequent saves update it.
            if (state.projectId !== result.projectId) {
              useGroundworkStore.setState({ projectId: result.projectId });
            }
          }
        } finally {
          inFlight.current = false;
        }
      }, 1200);
    };

    const unsub = useGroundworkStore.subscribe(trigger);
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return null;
}
