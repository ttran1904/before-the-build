"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getOrCreateBathroomProject } from "@/lib/supabase-sync";
import type { BuildBookBathroomState } from "@/lib/build-book/store";

const supabase = createSupabaseBrowserClient();

const BB_KEYS = [
  "bb_v2_styles",
  "bb_v2_inspiration_links",
  "bb_v2_item_source",
  "bb_v2_photos",
  "bb_v2_completed_at",
] as const;

export function buildBookHasContent(s: BuildBookBathroomState): boolean {
  return (
    s.styles.length > 0 ||
    (s.inspirationLinks ?? "").trim().length > 0 ||
    s.itemSource !== null ||
    s.photos.length > 0 ||
    s.completedAt !== null
  );
}

export interface SavedBuildBookV2 {
  projectId: string;
  data: Partial<BuildBookBathroomState>;
}

/** Upsert the active build-book design state into rooms.wizard_answers,
 *  merged alongside the legacy wizard fields. Returns the bound projectId. */
export async function saveBuildBookV2(
  state: BuildBookBathroomState,
  existingProjectId?: string | null,
): Promise<{ projectId: string } | null> {
  if (!buildBookHasContent(state)) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ids = await getOrCreateBathroomProject(existingProjectId ?? null);
  if (!ids) return null;

  const { data: room } = await supabase
    .from("rooms")
    .select("wizard_answers")
    .eq("id", ids.roomId)
    .single();

  const wa = (room?.wizard_answers as Record<string, unknown>) ?? {};
  const merged = {
    ...wa,
    bb_v2_styles: state.styles,
    bb_v2_inspiration_links: state.inspirationLinks,
    bb_v2_item_source: state.itemSource,
    bb_v2_photos: state.photos,
    bb_v2_completed_at: state.completedAt,
  };

  const { error } = await supabase
    .from("rooms")
    .update({ wizard_answers: merged })
    .eq("id", ids.roomId);

  if (error) {
    console.error("[saveBuildBookV2] update failed:", error);
    return null;
  }

  // Make sure a build_books row exists so it surfaces on the dashboard.
  const { data: existing } = await supabase
    .from("build_books")
    .select("id")
    .eq("project_id", ids.projectId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("build_books")
      .insert({ project_id: ids.projectId, scope_description: "Bathroom Renovation" });
  } else {
    await supabase
      .from("build_books")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  }

  return { projectId: ids.projectId };
}

/** Load the most recent build-book v2 payload for the current user. */
export async function loadLatestBuildBookV2(): Promise<SavedBuildBookV2 | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("build_books")
    .select("project_id, updated_at, projects!inner ( user_id )")
    .eq("projects.user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const projectId = data[0].project_id as string;
  const { data: rooms } = await supabase
    .from("rooms")
    .select("wizard_answers")
    .eq("project_id", projectId)
    .eq("type", "bathroom")
    .limit(1);

  const wa = (rooms?.[0]?.wizard_answers as Record<string, unknown>) ?? {};
  const hasV2 = BB_KEYS.some((k) => wa[k] !== undefined && wa[k] !== null);
  if (!hasV2) return null;

  return {
    projectId,
    data: {
      styles: (wa.bb_v2_styles as string[]) ?? [],
      inspirationLinks: (wa.bb_v2_inspiration_links as string) ?? "",
      itemSource: (wa.bb_v2_item_source as BuildBookBathroomState["itemSource"]) ?? null,
      photos: (wa.bb_v2_photos as string[]) ?? [],
      completedAt: (wa.bb_v2_completed_at as string | null) ?? null,
    },
  };
}