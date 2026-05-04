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
    // Start with no signature so the first run always attempts to push
    // whatever is sitting in localStorage up to Supabase.
    lastSavedSig.current = null;

    const flush = async () => {
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
          if (state.projectId !== result.projectId) {
            useGroundworkStore.setState({ projectId: result.projectId });
          }
        }
      } finally {
        inFlight.current = false;
      }
    };

    const trigger = (delay = 400) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    };

    // Rescue any localStorage draft as soon as we mount.
    trigger(0);

    const unsub = useGroundworkStore.subscribe(() => trigger());

    const onVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        void flush();
      }
    };
    const onPageHide = () => {
      void flush();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", onPageHide);
      window.addEventListener("beforeunload", onPageHide);
    }

    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", onPageHide);
        window.removeEventListener("beforeunload", onPageHide);
      }
    };
  }, []);

  return null;
}