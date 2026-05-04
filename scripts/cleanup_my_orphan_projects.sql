-- ============================================================
--  cleanup_my_orphan_projects.sql
--  Delete every project owned by ME that has NO build_book AND
--  NO groundwork_scope (i.e., empty shells from dev sessions).
--  Cofounder's projects are explicitly skipped.
--  Run in Supabase SQL editor.
-- ============================================================

BEGIN;

DO $$
DECLARE
  me        uuid := '9f8a5dba-2890-4709-b137-04132ab84c03';  -- thanh.trannthien@gmail.com
  cofounder uuid := 'd985d8a2-1d42-42c9-8aed-1eac2a8b650e';  -- lauren@beforethebuild.co
  v_orphan_count int;
BEGIN
  IF me = cofounder THEN
    RAISE EXCEPTION 'Refusing: my UUID equals the cofounder UUID';
  END IF;

  -- Identify orphan projects: mine, with no build_book and no groundwork_scope.
  CREATE TEMP TABLE _orphan_projects ON COMMIT DROP AS
  SELECT p.id
  FROM public.projects p
  WHERE p.user_id = me
    AND p.user_id <> cofounder  -- belt & suspenders
    AND NOT EXISTS (SELECT 1 FROM public.build_books      bb WHERE bb.project_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.groundwork_scopes g  WHERE g.project_id = p.id);

  SELECT count(*) INTO v_orphan_count FROM _orphan_projects;
  RAISE NOTICE 'Plan: delete % orphan projects (no build_book, no groundwork_scope).', v_orphan_count;

  -- Cascade-clean every child table that references projects directly or via rooms.
  -- chat_messages -> chat_sessions -> room_designs (project_id)
  DELETE FROM public.chat_messages
   WHERE chat_session_id IN (
     SELECT cs.id
     FROM public.chat_sessions cs
     JOIN public.room_designs rd ON rd.id = cs.room_design_id
     WHERE rd.project_id IN (SELECT id FROM _orphan_projects)
   );

  DELETE FROM public.chat_sessions
   WHERE room_design_id IN (
     SELECT id FROM public.room_designs
      WHERE project_id IN (SELECT id FROM _orphan_projects)
   );

  DELETE FROM public.room_designs
   WHERE project_id IN (SELECT id FROM _orphan_projects);

  -- Room-scoped children
  DELETE FROM public.furniture_items
   WHERE room_id IN (SELECT id FROM public.rooms WHERE project_id IN (SELECT id FROM _orphan_projects));

  DELETE FROM public.design_suggestions
   WHERE room_id IN (SELECT id FROM public.rooms WHERE project_id IN (SELECT id FROM _orphan_projects));

  DELETE FROM public.room_photos
   WHERE room_id IN (SELECT id FROM public.rooms WHERE project_id IN (SELECT id FROM _orphan_projects));

  DELETE FROM public.room_scans
   WHERE room_id IN (SELECT id FROM public.rooms WHERE project_id IN (SELECT id FROM _orphan_projects));

  DELETE FROM public.rooms
   WHERE project_id IN (SELECT id FROM _orphan_projects);

  -- Project-scoped siblings
  DELETE FROM public.inspiration_items
   WHERE project_id IN (SELECT id FROM _orphan_projects);

  DELETE FROM public.mood_boards
   WHERE project_id IN (SELECT id FROM _orphan_projects);

  DELETE FROM public.household_profiles
   WHERE project_id IN (SELECT id FROM _orphan_projects);

  -- Finally, the projects themselves.
  DELETE FROM public.projects
   WHERE id IN (SELECT id FROM _orphan_projects);

  RAISE NOTICE 'Done. Deleted % orphan projects for user %.', v_orphan_count, me;
END $$;

-- Sanity check.
SELECT
  (SELECT count(*) FROM public.projects
     WHERE user_id = '9f8a5dba-2890-4709-b137-04132ab84c03'::uuid) AS my_projects_remaining,
  (SELECT count(*) FROM public.projects
     WHERE user_id = 'd985d8a2-1d42-42c9-8aed-1eac2a8b650e'::uuid) AS cofounder_projects_unchanged,
  (SELECT count(*) FROM public.build_books bb
     JOIN public.projects p ON p.id = bb.project_id
     WHERE p.user_id = '9f8a5dba-2890-4709-b137-04132ab84c03'::uuid) AS my_build_books_remaining,
  (SELECT count(*) FROM public.groundwork_scopes
     WHERE user_id = '9f8a5dba-2890-4709-b137-04132ab84c03'::uuid)   AS my_groundwork_scopes_preserved;

-- Expected: my_projects_remaining = (build_books + groundwork_scopes for me),
-- cofounder_projects_unchanged = 1 (or whatever it was before).
COMMIT;