"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getOrCreateBathroomProject } from "@/lib/supabase-sync";
import type { GroundworkBathroomState } from "@/lib/groundwork/store";

const supabase = createSupabaseBrowserClient();

/** True when the user has touched ANY scope-defining field. We intentionally
 *  ignore `notes` / `photos` / `floorPlan` here so an empty draft with just an
 *  uploaded photo still saves — but a brand-new untouched store does not. */
export function groundworkHasContent(s: GroundworkBathroomState): boolean {
  return (
    s.projectType !== null ||
    s.bathroomKind !== null ||
    s.goals.length > 0 ||
    s.urgency !== null ||
    s.budgetTier !== null ||
    s.vanity !== null ||
    s.toilet !== null ||
    s.showerTub !== null ||
    s.flooring !== null ||
    s.walls !== null ||
    s.lighting !== null ||
    s.electrical !== null ||
    s.layout !== null ||
    s.photos.length > 0 ||
    s.floorPlan.length > 0 ||
    (s.notes ?? "").trim().length > 0
  );
}

interface GroundworkScopeRow {
  id: string;
  project_id: string;
  data: GroundworkBathroomState;
  project_type: string | null;
  bathroom_kind: string | null;
  budget_tier: string | null;
  has_content: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Upsert the active groundwork scope for the user's bathroom project.
 *  Returns null if the wizard is empty (we deliberately don't create a row). */
export async function saveGroundworkScope(
  state: GroundworkBathroomState,
  existingProjectId?: string | null,
): Promise<string | null> {
  if (!groundworkHasContent(state)) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ids = await getOrCreateBathroomProject(existingProjectId);
  if (!ids) return null;

  const payload = {
    user_id: user.id,
    project_id: ids.projectId,
    data: state,
    project_type: state.projectType,
    bathroom_kind: state.bathroomKind,
    budget_tier: state.budgetTier,
    has_content: true,
    completed_at: state.completedAt,
  };

  const { data, error } = await supabase
    .from("groundwork_scopes")
    .upsert(payload, { onConflict: "project_id" })
    .select("id")
    .single();

  if (error) {
    console.error("[saveGroundworkScope] upsert failed:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Load the most recently updated groundwork scope for the current user. */
export async function loadLatestGroundworkScope(): Promise<GroundworkScopeRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("groundwork_scopes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[loadLatestGroundworkScope] failed:", error);
    return null;
  }
  return (data as GroundworkScopeRow) ?? null;
}