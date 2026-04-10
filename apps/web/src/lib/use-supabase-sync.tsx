"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useWizardStore, useMoodboardStore } from "@/lib/store";
import {
  saveWizardState,
  loadWizardState,
  saveMoodboards,
  loadMoodboards,
  saveBuildBook,
} from "@/lib/supabase-sync";

const DEBOUNCE_MS = 2000; // Save 2s after last change

/**
 * Hook that syncs Zustand stores ↔ Supabase.
 * - On login: loads remote data into stores (if remote is newer / local is empty)
 * - On store changes: debounced save to Supabase
 *
 * Place this in a component rendered inside AuthProvider (e.g. root layout).
 */
export function useSupabaseSync() {
  const { user, loading: authLoading } = useAuth();
  const hasLoadedRef = useRef(false);
  const wizardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from Supabase on login ──
  useEffect(() => {
    if (authLoading || !user || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    (async () => {
      // Load wizard state
      const remoteWizard = await loadWizardState();
      if (remoteWizard) {
        const localState = useWizardStore.getState();
        // Only overwrite if local store seems empty (no goals set)
        const localIsEmpty = localState.goals.length === 0 && !localState.scope;
        if (localIsEmpty) {
          useWizardStore.setState(remoteWizard);
        }
      }

      // Load moodboards
      const remoteMoodboards = await loadMoodboards();
      if (remoteMoodboards) {
        const localMoodboard = useMoodboardStore.getState();
        const localIsEmpty = localMoodboard.boards.length === 0;
        if (localIsEmpty && remoteMoodboards.boards.length > 0) {
          useMoodboardStore.setState({
            boards: remoteMoodboards.boards,
            items: remoteMoodboards.items,
          });
        }
      }
    })();
  }, [user, authLoading]);

  // Reset load flag on logout
  useEffect(() => {
    if (!user) {
      hasLoadedRef.current = false;
    }
  }, [user]);

  // ── Debounced save: wizard store ──
  const debouncedSaveWizard = useCallback(() => {
    if (!user) return;
    if (wizardTimerRef.current) clearTimeout(wizardTimerRef.current);
    wizardTimerRef.current = setTimeout(() => {
      const state = useWizardStore.getState();
      saveWizardState(state).catch(console.error);
    }, DEBOUNCE_MS);
  }, [user]);

  // ── Debounced save: moodboard store ──
  const debouncedSaveMoodboard = useCallback(() => {
    if (!user) return;
    if (moodboardTimerRef.current) clearTimeout(moodboardTimerRef.current);
    moodboardTimerRef.current = setTimeout(() => {
      const { boards, items } = useMoodboardStore.getState();
      saveMoodboards(boards, items).catch(console.error);
    }, DEBOUNCE_MS);
  }, [user]);

  // ── Subscribe to store changes ──
  useEffect(() => {
    if (!user) return;

    const unsubWizard = useWizardStore.subscribe(debouncedSaveWizard);
    const unsubMoodboard = useMoodboardStore.subscribe(debouncedSaveMoodboard);

    return () => {
      unsubWizard();
      unsubMoodboard();
      if (wizardTimerRef.current) clearTimeout(wizardTimerRef.current);
      if (moodboardTimerRef.current) clearTimeout(moodboardTimerRef.current);
    };
  }, [user, debouncedSaveWizard, debouncedSaveMoodboard]);
}

/**
 * Wrapper component to use the hook in the layout.
 * Renders nothing — just runs the sync logic.
 */
export function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  useSupabaseSync();
  return <>{children}</>;
}
