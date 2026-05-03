"use client";

/**
 * Inspiration item persistence — wraps Supabase mood_boards + inspiration_items
 * so the Groundwork intake (and anything else) can save/remove individual
 * items immediately on click.
 *
 * Each project gets a single implicit "intake" mood board (source = "intake")
 * that the wizard writes to. We also mirror writes into the local
 * useIdeaBoardStore so the dashboard idea-boards page reflects them with no
 * other code changes.
 */

import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useIdeaBoardStore } from "@/lib/store";

const supabase = createSupabaseBrowserClient();

export type InspirationSource =
  | "pinterest"
  | "instagram"
  | "google"
  | "etsy"
  | "house_tour"
  | "resort"
  | "magazine"
  | "upload";

const VALID_SOURCES: ReadonlySet<string> = new Set([
  "pinterest",
  "instagram",
  "google",
  "etsy",
  "house_tour",
  "resort",
  "magazine",
  "upload",
]);

export interface InspirationItemInput {
  /** Stable client-side id (used for de-dupe + local store key). */
  clientId: string;
  imageUrl: string;
  sourceUrl?: string | null;
  source: InspirationSource | string;
  title?: string;
  tags?: string[];
}

const INTAKE_BOARD_NAME = "From your intake";

interface IntakeBoardIds {
  projectId: string;
  moodBoardId: string;
}

const intakeBoardCache = new Map<string, Promise<IntakeBoardIds | null>>();

/** Get the user's intake mood board for the given project, creating it if
 *  needed. Returns null if the user is not signed in. */
export async function getOrCreateIntakeBoard(
  projectId: string,
): Promise<IntakeBoardIds | null> {
  const cached = intakeBoardCache.get(projectId);
  if (cached) return cached;

  const promise = (async (): Promise<IntakeBoardIds | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Use limit(1) instead of maybeSingle so duplicate rows (legacy data)
    // don't throw — we just take the first one.
    const { data: existing } = await supabase
      .from("mood_boards")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .eq("source", "intake")
      .order("created_at", { ascending: true })
      .limit(1);

    const existingId = existing?.[0]?.id;
    if (existingId) {
      return { projectId, moodBoardId: existingId };
    }

    const { data: created, error } = await supabase
      .from("mood_boards")
      .insert({
        user_id: user.id,
        project_id: projectId,
        name: INTAKE_BOARD_NAME,
        source: "intake",
      })
      .select("id")
      .single();

    if (error || !created?.id) {
      // Likely RLS or missing migration. Local mirror still works, so
      // just warn (not error → no Next.js dev overlay) and fall back.
      console.warn(
        "[inspiration] supabase intake board unavailable, using local store only.",
      );
      return null;
    }
    return { projectId, moodBoardId: created.id };
  })();

  intakeBoardCache.set(projectId, promise);
  // If it resolves to null, drop the cache so we retry next time.
  promise.then((r) => {
    if (!r) intakeBoardCache.delete(projectId);
  });
  return promise;
}

/** Insert an inspiration_item linked to the project's intake board. Mirrors
 *  the same item into the local IdeaBoardStore so the dashboard updates. */
export async function saveInspirationItem(
  projectId: string | null,
  item: InspirationItemInput,
): Promise<string | null> {
  // Local mirror first (no auth required, instant UX).
  mirrorSaveLocal(item);

  if (!projectId) return null;
  const ids = await getOrCreateIntakeBoard(projectId);
  if (!ids) return null;

  const source = VALID_SOURCES.has(item.source) ? item.source : "google";

  const { data, error } = await supabase
    .from("inspiration_items")
    .insert({
      project_id: ids.projectId,
      mood_board_id: ids.moodBoardId,
      source,
      image_url: item.imageUrl,
      source_url: item.sourceUrl ?? null,
      tags: item.tags ?? [],
      notes: item.title ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[inspiration] supabase insert skipped (local-only).");
    return null;
  }
  return data?.id ?? null;
}

/** Remove an inspiration_item from the project's intake board (matches by
 *  image_url). Also removes from the local mirror. */
export async function removeInspirationItem(
  projectId: string | null,
  item: Pick<InspirationItemInput, "clientId" | "imageUrl">,
): Promise<void> {
  mirrorRemoveLocal(item.clientId);

  if (!projectId) return;
  const ids = await getOrCreateIntakeBoard(projectId);
  if (!ids) return;

  const { error } = await supabase
    .from("inspiration_items")
    .delete()
    .eq("mood_board_id", ids.moodBoardId)
    .eq("image_url", item.imageUrl);

  if (error) console.warn("[inspiration] supabase delete skipped (local-only).");
}

/* ------------------------------------------------------------------ */
/*  Local IdeaBoardStore mirror                                        */
/* ------------------------------------------------------------------ */

function mirrorSaveLocal(item: InspirationItemInput) {
  const store = useIdeaBoardStore.getState();
  let local = store.boards.find((b) => b.source === "intake");
  if (!local) {
    const id = store.createBoard(INTAKE_BOARD_NAME, "intake");
    local = { id, name: INTAKE_BOARD_NAME, createdAt: Date.now(), source: "intake" };
  }
  store.saveItemToBoard(
    {
      id: item.clientId,
      imageUrl: item.imageUrl,
      sourceUrl: item.sourceUrl ?? undefined,
      source: item.source,
      tags: item.tags ?? [],
      title: item.title,
    },
    local.id,
  );
}

function mirrorRemoveLocal(clientId: string) {
  const store = useIdeaBoardStore.getState();
  const local = store.boards.find((b) => b.source === "intake");
  if (!local) return;
  store.removeItemFromBoard(clientId, local.id);
}
