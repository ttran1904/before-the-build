"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getOrCreateBathroomProject } from "@/lib/supabase-sync";
import type { GroundworkBathroomState } from "@/lib/groundwork/store";

const supabase = createSupabaseBrowserClient();

/** True when the user has touched ANY scope-defining field. */
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

export interface GroundworkScopeRow {
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

/** Upsert the active groundwork scope. Returns the project_id it bound to,
 *  so the local store can persist that id and keep updating the same row. */
export async function saveGroundworkScope(
  state: GroundworkBathroomState,
  existingProjectId?: string | null,
): Promise<{ id: string; projectId: string } | null> {
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
  return data ? { id: data.id, projectId: ids.projectId } : null;
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

/** Load every groundwork scope for the current user, newest first. */
export async function loadAllGroundworkScopes(): Promise<GroundworkScopeRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("groundwork_scopes")
    .select("*")
    .eq("user_id", user.id)
    .eq("has_content", true)
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("[loadAllGroundworkScopes] failed:", error);
    return [];
  }
  return (data as GroundworkScopeRow[]) ?? [];
}

/** Load one scope by project_id. */
export async function loadGroundworkScopeByProjectId(
  projectId: string,
): Promise<GroundworkScopeRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("groundwork_scopes")
    .select("*")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) {
    console.warn("[loadGroundworkScopeByProjectId] failed:", error);
    return null;
  }
  return (data as GroundworkScopeRow) ?? null;
}

/** Delete a groundwork scope by id. Returns true only if a row was actually removed. */
export async function deleteGroundworkScope(id: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("groundwork_scopes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error) {
    console.warn("[deleteGroundworkScope] failed:", error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

/** Delete every groundwork scope owned by the current user. Returns the number removed. */
export async function deleteAllGroundworkScopesForCurrentUser(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase
    .from("groundwork_scopes")
    .delete()
    .eq("user_id", user.id)
    .select("id");
  if (error) {
    console.warn("[deleteAllGroundworkScopesForCurrentUser] failed:", error);
    return 0;
  }
  return Array.isArray(data) ? data.length : 0;
}
