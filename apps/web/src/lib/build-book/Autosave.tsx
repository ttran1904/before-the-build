"use client";

import { useEffect, useRef } from "react";
import { useBuildBookStore, type BuildBookBathroomState } from "@/lib/build-book/store";
import { saveBuildBookV2, buildBookHasContent } from "@/lib/build-book/sync";

function signatureOf(s: BuildBookBathroomState): string {
  return JSON.stringify({
    styles: s.styles,
    inspirationLinks: s.inspirationLinks,
    itemSource: s.itemSource,
    photos: s.photos,
    completedAt: s.completedAt,
  });
}

export function BuildBookAutosave() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const lastSavedSig = useRef<string | null>(null);

  useEffect(() => {
    lastSavedSig.current = null;

    const flush = async () => {
      if (inFlight.current) return;
      const state = useBuildBookStore.getState();
      if (!buildBookHasContent(state)) return;

      const sig = signatureOf(state);
      if (sig === lastSavedSig.current) return;

      inFlight.current = true;
      try {
        const result = await saveBuildBookV2(state, state.projectId);
        if (result) {
          lastSavedSig.current = sig;
          if (state.projectId !== result.projectId) {
            useBuildBookStore.setState({ projectId: result.projectId });
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

    trigger(0);

    const unsub = useBuildBookStore.subscribe(() => trigger());

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