import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { BathroomWizardState } from "@/lib/store";
import type { IdeaBoardItem, IdeaBoard } from "@/lib/store";

const supabase = createSupabaseBrowserClient();

/* ================================================================
   PROJECT + ROOM  (wizard answers)
   ================================================================ */

/** Get or create the user's bathroom renovation project + room.
 *  If existingProjectId is given, reuse that project.
 *  Otherwise create a brand-new project (supports multiple build books).
 *  Returns { projectId, roomId } */
export async function getOrCreateBathroomProject(
  existingProjectId?: string | null,
): Promise<{
  projectId: string;
  roomId: string;
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let projectId: string;

  if (existingProjectId) {
    // Verify this project exists and belongs to the user
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", existingProjectId)
      .eq("user_id", user.id)
      .single();

    if (project) {
      projectId = project.id;
    } else {
      // Project not found — create a new one
      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name: "Bathroom Renovation", status: "planning" })
        .select("id")
        .single();
      if (error || !newProject) {
        console.error("Failed to create project:", error);
        return null;
      }
      projectId = newProject.id;
    }
  } else {
    // No projectId — create a brand-new project
    const { data: newProject, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name: "Bathroom Renovation", status: "planning" })
      .select("id")
      .single();
    if (error || !newProject) {
      console.error("Failed to create project:", error);
      return null;
    }
    projectId = newProject.id;
  }

  // Try to find existing bathroom room for this project
  const { data: existingRooms } = await supabase
    .from("rooms")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", "bathroom")
    .limit(1);

  let roomId: string;

  if (existingRooms && existingRooms.length > 0) {
    roomId = existingRooms[0].id;
  } else {
    const { data: newRoom, error } = await supabase
      .from("rooms")
      .insert({ project_id: projectId, name: "Bathroom", type: "bathroom" })
      .select("id")
      .single();
    if (error || !newRoom) {
      console.error("Failed to create room:", error);
      return null;
    }
    roomId = newRoom.id;
  }

  return { projectId, roomId };
}

/** Save wizard state to Supabase (rooms.wizard_answers + project fields).
 *  Returns { projectId, roomId } on success so caller can store them. */
export async function saveWizardState(state: BathroomWizardState): Promise<{
  projectId: string;
  roomId: string;
} | null> {
  const ids = await getOrCreateBathroomProject(state.projectId);
  if (!ids) return null;

  // Save the full wizard state as JSONB in rooms.wizard_answers
  const { error: roomError } = await supabase
    .from("rooms")
    .update({
      wizard_answers: {
        goals: state.goals,
        scope: state.scope,
        must_haves: state.mustHaves,
        nice_to_haves: state.niceToHaves,
        budget_tier: state.budgetTier,
        budget_amount: state.budgetAmount,
        budget_amounts: state.budgetAmounts,
        style: state.style,
        bathroom_size: state.bathroomSize,
        room_width: state.roomWidth,
        room_width_in: state.roomWidthIn,
        room_length: state.roomLength,
        room_length_in: state.roomLengthIn,
        room_height: state.roomHeight,
        room_height_in: state.roomHeightIn,
        shower_width: state.showerWidth,
        shower_width_in: state.showerWidthIn,
        shower_length: state.showerLength,
        shower_length_in: state.showerLengthIn,
        room_width_m: state.roomWidthM,
        room_length_m: state.roomLengthM,
        room_height_m: state.roomHeightM,
        shower_width_m: state.showerWidthM,
        shower_length_m: state.showerLengthM,
        measurement_unit: state.measurementUnit,
        current_step: state.currentStep,
        price_overrides: state.priceOverrides,
        moodboard_pointed_items: state.moodboardPointedItems,
        moodboard_manual_products: state.moodboardManualProducts,
        moodboard_drag_positions: state.moodboardDragPositions,
        // Note: mockup photos (base64) are large — store URLs only
        mockup_generated_images: state.mockupGeneratedImages,
      },
      width: parseFloat(state.roomWidth) || null,
      length: parseFloat(state.roomLength) || null,
      height: parseFloat(state.roomHeight) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ids.roomId);

  if (roomError) {
    console.error("Failed to save wizard answers:", roomError);
    return null;
  }

  // Also update project-level fields
  const { error: projectError } = await supabase
    .from("projects")
    .update({
      goals: state.goals,
      must_haves: state.mustHaves,
      nice_to_haves: state.niceToHaves,
      preferred_styles: state.style ? [state.style] : [],
      budget: state.budgetAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ids.projectId);

  if (projectError) {
    console.error("Failed to save project fields:", projectError);
    return null;
  }

  return ids;
}

/** Load wizard state from Supabase for a specific project (or the most recent one).
 *  Returns partial state to merge into store, including projectId/roomId. */
export async function loadWizardState(existingProjectId?: string | null): Promise<Partial<BathroomWizardState> | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let projectId: string;
  let roomId: string;

  if (existingProjectId) {
    // Load specific project
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", existingProjectId)
      .eq("user_id", user.id)
      .single();
    if (!project) return null;
    projectId = project.id;

    const { data: rooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("project_id", projectId)
      .eq("type", "bathroom")
      .limit(1);
    if (!rooms || rooms.length === 0) return null;
    roomId = rooms[0].id;
  } else {
    // Find the most recent project that has a build book
    const { data: recentBB } = await supabase
      .from("build_books")
      .select("project_id, projects!inner ( user_id )")
      .eq("projects.user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!recentBB || recentBB.length === 0) return null;
    projectId = recentBB[0].project_id;

    const { data: rooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("project_id", projectId)
      .eq("type", "bathroom")
      .limit(1);
    if (!rooms || rooms.length === 0) return null;
    roomId = rooms[0].id;
  }

  const { data: room, error } = await supabase
    .from("rooms")
    .select("wizard_answers")
    .eq("id", roomId)
    .single();

  if (error || !room?.wizard_answers) return null;

  const wa = room.wizard_answers as Record<string, unknown>;

  // Only return if there's meaningful data
  if (!wa.goals && !wa.scope && !wa.budget_tier) return null;

  return {
    projectId,
    roomId,
    goals: (wa.goals as string[]) || [],
    scope: (wa.scope as BathroomWizardState["scope"]) || null,
    mustHaves: (wa.must_haves as string[]) || [],
    niceToHaves: (wa.nice_to_haves as string[]) || [],
    budgetTier: (wa.budget_tier as BathroomWizardState["budgetTier"]) || null,
    budgetAmount: (wa.budget_amount as number) || null,
    budgetAmounts: (wa.budget_amounts as BathroomWizardState["budgetAmounts"]) || { basic: null, mid: null, high: null },
    style: (wa.style as BathroomWizardState["style"]) || null,
    bathroomSize: (wa.bathroom_size as BathroomWizardState["bathroomSize"]) || "full-bath",
    roomWidth: (wa.room_width as string) || "",
    roomWidthIn: (wa.room_width_in as string) || "",
    roomLength: (wa.room_length as string) || "",
    roomLengthIn: (wa.room_length_in as string) || "",
    roomHeight: (wa.room_height as string) || "",
    roomHeightIn: (wa.room_height_in as string) || "",
    showerWidth: (wa.shower_width as string) || "",
    showerWidthIn: (wa.shower_width_in as string) || "",
    showerLength: (wa.shower_length as string) || "",
    showerLengthIn: (wa.shower_length_in as string) || "",
    roomWidthM: (wa.room_width_m as string) || "",
    roomLengthM: (wa.room_length_m as string) || "",
    roomHeightM: (wa.room_height_m as string) || "",
    showerWidthM: (wa.shower_width_m as string) || "",
    showerLengthM: (wa.shower_length_m as string) || "",
    measurementUnit: (wa.measurement_unit as "ft" | "m") || "ft",
    currentStep: (wa.current_step as number) || 0,
    priceOverrides: (wa.price_overrides as BathroomWizardState["priceOverrides"]) || [],
    moodboardPointedItems: (wa.moodboard_pointed_items as BathroomWizardState["moodboardPointedItems"]) || {},
    moodboardManualProducts: (wa.moodboard_manual_products as BathroomWizardState["moodboardManualProducts"]) || [],
    moodboardDragPositions: (wa.moodboard_drag_positions as BathroomWizardState["moodboardDragPositions"]) || {},
    mockupGeneratedImages: (wa.mockup_generated_images as string[]) || [],
  };
}

/* ================================================================
   IDEA BOARDS + INSPIRATION ITEMS
   ================================================================ */

/** Helper: check if a string is a valid UUID v4 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(s: string): boolean {
  return UUID_RE.test(s);
}

/** Save all idea boards & items to Supabase */
export async function saveIdeaBoards(
  boards: IdeaBoard[],
  items: IdeaBoardItem[],
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Only sync boards that have valid UUID IDs (old format board_xxx will be skipped)
  const syncableBoards = boards.filter((b) => isUUID(b.id));

  // --- Sync boards ---
  // Get existing boards for this user
  const { data: existingBoards } = await supabase
    .from("mood_boards")
    .select("id, name")
    .eq("user_id", user.id);

  const existingBoardIds = new Set((existingBoards || []).map((b) => b.id));
  const localBoardIds = new Set(syncableBoards.map((b) => b.id));

  // Upsert boards that exist locally
  for (const board of syncableBoards) {
    if (existingBoardIds.has(board.id)) {
      await supabase
        .from("mood_boards")
        .update({ name: board.name, updated_at: new Date().toISOString() })
        .eq("id", board.id);
    } else {
      const { error } = await supabase.from("mood_boards").insert({
        id: board.id,
        user_id: user.id,
        name: board.name,
        created_at: new Date(board.createdAt).toISOString(),
      });
      if (error) {
        console.error("Failed to insert board:", error);
      }
    }
  }

  // Delete boards that were removed locally
  for (const existing of existingBoards || []) {
    if (!localBoardIds.has(existing.id)) {
      // Also delete associated inspiration items first
      await supabase.from("inspiration_items").delete().eq("mood_board_id", existing.id);
      await supabase.from("mood_boards").delete().eq("id", existing.id);
    }
  }

  // --- Sync inspiration items ---
  // Delete all existing items for syncable boards, then re-insert
  const allBoardIds = syncableBoards.map((b) => b.id);
  if (allBoardIds.length > 0) {
    await supabase
      .from("inspiration_items")
      .delete()
      .in("mood_board_id", allBoardIds);
  }

  // Get a project ID for linking (inspiration_items.project_id is NOT NULL)
  // Find the user's most recent project to link items to
  const { data: recentProject } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let linkProjectId: string | null = recentProject?.id ?? null;
  if (!linkProjectId) {
    // Create a fallback project
    const ids = await getOrCreateBathroomProject();
    linkProjectId = ids?.projectId ?? null;
  }

  // Insert items — one row per item-board relationship
  // Don't set `id` — let the DB auto-generate UUIDs
  const VALID_SOURCES = new Set(["pinterest", "instagram", "google", "etsy", "house_tour", "resort", "magazine", "upload"]);
  const rows = items.flatMap((item) =>
    item.boardIds
      .filter((boardId) => isUUID(boardId)) // only sync items linked to UUID boards
      .map((boardId) => ({
        mood_board_id: boardId,
        project_id: linkProjectId,
        source: VALID_SOURCES.has(item.source) ? item.source : "google",
        image_url: item.imageUrl,
        source_url: item.sourceUrl || null,
        tags: item.tags || [],
      })),
  );

  if (rows.length > 0) {
    // Batch insert in chunks of 50
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { error } = await supabase.from("inspiration_items").insert(chunk);
      if (error) {
        console.error("Failed to save inspiration items:", error);
      }
    }
  }

  return true;
}

/** Load idea boards & items from Supabase */
export async function loadIdeaBoards(): Promise<{
  boards: IdeaBoard[];
  items: IdeaBoardItem[];
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Load boards
  const { data: dbBoards, error: boardError } = await supabase
    .from("mood_boards")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (boardError) {
    console.error("Failed to load idea boards:", boardError);
    return null;
  }

  const boards: IdeaBoard[] = (dbBoards || []).map((b) => ({
    id: b.id,
    name: b.name,
    createdAt: new Date(b.created_at).getTime(),
  }));

  if (boards.length === 0) return { boards: [], items: [] };

  // Load inspiration items for all user boards
  const boardIds = boards.map((b) => b.id);
  const { data: dbItems, error: itemError } = await supabase
    .from("inspiration_items")
    .select("id, image_url, source_url, tags, mood_board_id")
    .in("mood_board_id", boardIds);

  if (itemError) {
    console.error("Failed to load inspiration items:", itemError);
    return { boards, items: [] };
  }

  // Group items by image_url to reconstruct the many-to-many
  const itemMap = new Map<
    string,
    { imageUrl: string; sourceUrl?: string; tags: string[]; boardIds: string[] }
  >();

  for (const row of dbItems || []) {
    const key = row.image_url;
    const existing = itemMap.get(key);
    if (existing) {
      if (row.mood_board_id && !existing.boardIds.includes(row.mood_board_id)) {
        existing.boardIds.push(row.mood_board_id);
      }
    } else {
      itemMap.set(key, {
        imageUrl: row.image_url,
        sourceUrl: row.source_url || undefined,
        tags: row.tags || [],
        boardIds: row.mood_board_id ? [row.mood_board_id] : [],
      });
    }
  }

  const items: IdeaBoardItem[] = Array.from(itemMap.entries()).map(
    ([, data]) => ({
      id: crypto.randomUUID(),
      imageUrl: data.imageUrl,
      sourceUrl: data.sourceUrl,
      source: "google",
      tags: data.tags,
      saved: true,
      boardIds: data.boardIds,
    }),
  );

  return { boards, items };
}

/* ================================================================
   BUILD BOOK
   ================================================================ */

/** Save/update a build book from wizard state */
export async function saveBuildBook(projectId?: string | null): Promise<string | null> {
  const ids = await getOrCreateBathroomProject(projectId);
  if (!ids) return null;

  // Upsert build book
  const { data: existing } = await supabase
    .from("build_books")
    .select("id")
    .eq("project_id", ids.projectId)
    .single();

  let buildBookId: string;

  if (existing) {
    buildBookId = existing.id;
    await supabase
      .from("build_books")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", buildBookId);
  } else {
    const { data: newBB, error } = await supabase
      .from("build_books")
      .insert({
        project_id: ids.projectId,
        scope_description: "Bathroom Renovation",
      })
      .select("id")
      .single();
    if (error || !newBB) {
      console.error("Failed to create build book:", error);
      return null;
    }
    buildBookId = newBB.id;
  }

  return buildBookId;
}

/** Delete a build book and its associated project */
export async function deleteBuildBook(buildBookId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Get the project_id first to delete the whole project
  const { data: bb } = await supabase
    .from("build_books")
    .select("project_id")
    .eq("id", buildBookId)
    .single();

  if (!bb) return false;

  // Verify user owns the project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", bb.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) return false;

  // Delete the project (cascades to rooms, build_books, etc.)
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", bb.project_id);

  return !error;
}

/** Load list of build books for dashboard display */
export async function loadBuildBooks(): Promise<
  Array<{
    id: string;
    projectId: string;
    name: string;
    updatedAt: string;
    totalCost: number;
    currentStep: number;
    mockupImage?: string;
    moodboardThumbnails: string[];
  }>
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("build_books")
    .select(`
      id,
      project_id,
      scope_description,
      total_estimated_cost,
      updated_at,
      projects!inner ( name, user_id )
    `)
    .eq("projects.user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  // For each build book, try to get the mockup image from wizard_answers
  const results = [];
  for (const bb of data) {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("wizard_answers")
      .eq("project_id", bb.project_id)
      .limit(1);

    const wa = rooms?.[0]?.wizard_answers as Record<string, unknown> | undefined;
    const mockupImages = (wa?.mockup_generated_images as string[]) || [];

    // Extract product thumbnails from moodboard items
    const moodboardThumbnails: string[] = [];
    const pointedItems = wa?.moodboard_pointed_items as Record<string, { products?: { thumbnail?: string }[] }[]> | undefined;
    if (pointedItems) {
      for (const items of Object.values(pointedItems)) {
        for (const item of items) {
          const thumb = item.products?.[0]?.thumbnail;
          if (thumb) { moodboardThumbnails.push(thumb); break; }
        }
        if (moodboardThumbnails.length > 0) break;
      }
    }
    const manualProducts = wa?.moodboard_manual_products as { thumbnail?: string }[] | undefined;
    if (manualProducts && moodboardThumbnails.length === 0) {
      for (const p of manualProducts) {
        if (p.thumbnail) { moodboardThumbnails.push(p.thumbnail); break; }
      }
    }

    const currentStep = (wa?.current_step as number) || 0;

    results.push({
      id: bb.id,
      projectId: bb.project_id,
      name: bb.scope_description || "Bathroom Renovation",
      updatedAt: bb.updated_at,
      totalCost: bb.total_estimated_cost || 0,
      currentStep,
      mockupImage: mockupImages[0],
      moodboardThumbnails,
    });
  }

  return results;
}
