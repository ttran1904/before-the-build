"use client";

import { useEffect, useRef } from "react";
import { useGroundworkStore } from "@/lib/groundwork/store";
import { saveGroundworkScope, groundworkHasContent } from "@/lib/groundwork/sync";

/** Mounts a debounced subscription that pushes the groundwork store to
 *  Supabase whenever the user pauses for 1.2s. Renders nothing. */
export function GroundworkAutosave() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const trigger = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        if (inFlight.current) return;
        const state = useGroundworkStore.getState();
        if (!groundworkHasContent(state)) return;
        inFlight.current = true;
        try {
          await saveGroundworkScope(state);
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