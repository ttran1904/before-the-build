"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useWizardStore, useIdeaBoardStore } from "@/lib/store";
import {
  saveWizardState,
  loadWizardState,
  saveIdeaBoards,
  loadIdeaBoards,
  saveBuildBook,
  loadBathroomPhotos,
} from "@/lib/supabase-sync";
import { GroundworkAutosave } from "@/lib/groundwork/Autosave";
import { BuildBookAutosave } from "@/lib/build-book/Autosave";
import { useBuildBookStore } from "@/lib/build-book/store";
import { loadLatestBuildBookV2 } from "@/lib/build-book/sync";

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
  const ideaBoardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from Supabase on login ──
  useEffect(() => {
    if (authLoading || !user || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    (async () => {
      // Load wizard state (for the most recent project with a build book)
      const localState = useWizardStore.getState();
      const localIsEmpty = localState.goals.length === 0 && !localState.scope;

      if (localIsEmpty) {
        const remoteWizard = await loadWizardState(localState.projectId);
        if (remoteWizard) {
          useWizardStore.setState(remoteWizard);
        }
      }

      // Always reload bathroom photos from Supabase Storage (URLs are small,
      // and ensures photos persist across refreshes / devices).
      const currentRoomId = useWizardStore.getState().roomId;
      if (currentRoomId) {
        const photos = await loadBathroomPhotos(currentRoomId);
        if (photos.length > 0) {
          useWizardStore.setState({ mockupBathroomPhotos: photos });
        }
      }

      // Load idea boards
      const remoteIdeaBoards = await loadIdeaBoards();
      if (remoteIdeaBoards) {
        const localIdeaBoard = useIdeaBoardStore.getState();
        const localBoardsEmpty = localIdeaBoard.boards.length === 0;
        if (localBoardsEmpty && remoteIdeaBoards.boards.length > 0) {
          useIdeaBoardStore.setState({
            boards: remoteIdeaBoards.boards,
            items: remoteIdeaBoards.items,
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
    wizardTimerRef.current = setTimeout(async () => {
      const state = useWizardStore.getState();
      try {
        const ids = await saveWizardState(state);
        // Store the projectId/roomId back so future saves reuse the same project
        if (ids && (!state.projectId || !state.roomId)) {
          useWizardStore.setState({ projectId: ids.projectId, roomId: ids.roomId });
        }
        // Also ensure a build_books row exists so it shows on the dashboard
        if (ids) {
          await saveBuildBook(ids.projectId).catch(console.error);
        }
      } catch (err) {
        console.error("Failed to save wizard state:", err);
      }
    }, DEBOUNCE_MS);
  }, [user]);

  // ── Debounced save: idea board store ──
  const debouncedSaveIdeaBoard = useCallback(() => {
    if (!user) return;
    if (ideaBoardTimerRef.current) clearTimeout(ideaBoardTimerRef.current);
    ideaBoardTimerRef.current = setTimeout(() => {
      const { boards, items } = useIdeaBoardStore.getState();
      saveIdeaBoards(boards, items).catch(console.error);
    }, DEBOUNCE_MS);
  }, [user]);

  // ── Subscribe to store changes ──
  useEffect(() => {
    if (!user) return;

    const unsubWizard = useWizardStore.subscribe(debouncedSaveWizard);
    const unsubIdeaBoard = useIdeaBoardStore.subscribe(debouncedSaveIdeaBoard);

    return () => {
      unsubWizard();
      unsubIdeaBoard();
      if (wizardTimerRef.current) clearTimeout(wizardTimerRef.current);
      if (ideaBoardTimerRef.current) clearTimeout(ideaBoardTimerRef.current);
    };
  }, [user, debouncedSaveWizard, debouncedSaveIdeaBoard]);
}


function useBuildBookHydrate() {
  const { user, loading: authLoading } = useAuth();
  const hydrated = useRef(false);
  useEffect(() => {
    if (authLoading || !user || hydrated.current) return;
    hydrated.current = true;
    (async () => {
      const local = useBuildBookStore.getState();
      const localHasContent =
        local.styles.length > 0 ||
        (local.inspirationLinks ?? "").trim().length > 0 ||
        local.itemSource !== null ||
        local.photos.length > 0;
      if (localHasContent) return;
      const remote = await loadLatestBuildBookV2();
      if (remote) {
        useBuildBookStore.getState().loadFrom(remote.data, remote.projectId);
      }
    })();
  }, [user, authLoading]);
  useEffect(() => {
    if (!user) hydrated.current = false;
  }, [user]);
}

/**
 * Wrapper component to use the hook in the layout.
 * Renders nothing — just runs the sync logic.
 */
export function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  useSupabaseSync();
  useBuildBookHydrate();
  return (
    <>
      <GroundworkAutosave />
      <BuildBookAutosave />
      {children}
    </>
  );
}
