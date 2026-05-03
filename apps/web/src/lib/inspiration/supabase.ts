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

/** Get the user's intake mood board for the given project, creating it if
 *  needed. Returns null if the user is not signed in. */
export async function getOrCreateIntakeBoard(
  projectId: string,
): Promise<IntakeBoardIds | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("mood_boards")
    .select("id")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .eq("source", "intake")
    .maybeSingle();

  if (existing?.id) {
    return { projectId, moodBoardId: existing.id };
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
    console.error("[inspiration] failed to create intake board:", error);
    return null;
  }
  return { projectId, moodBoardId: created.id };
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
    console.error("[inspiration] insert failed:", error);
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

  if (error) console.error("[inspiration] delete failed:", error);
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
