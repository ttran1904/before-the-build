-- ============================================================
--  cleanup_my_buildbooks.sql
--  Wipe all Build Books owned by ME, preserving the cofounder's
--  data and my Groundwork Scopes. Run in Supabase SQL editor.
-- ============================================================

BEGIN;

DO $$
DECLARE
  me        uuid := '9f8a5dba-2890-4709-b137-04132ab84c03';  -- thanh.trannthien@gmail.com
  cofounder uuid := 'd985d8a2-1d42-42c9-8aed-1eac2a8b650e';  -- lauren@beforethebuild.co
  v_bb_count   int;
  v_proj_count int;
BEGIN
  IF me = cofounder THEN
    RAISE EXCEPTION 'Refusing: my UUID equals the cofounder UUID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = me) THEN
    RAISE EXCEPTION 'Refusing: user % not found in auth.users', me;
  END IF;

  -- Snapshot what we are about to delete.
  SELECT count(*) INTO v_bb_count
  FROM public.build_books bb
  JOIN public.projects p ON p.id = bb.project_id
  WHERE p.user_id = me;

  SELECT count(*) INTO v_proj_count
  FROM public.projects p
  WHERE p.user_id = me
    AND EXISTS (SELECT 1 FROM public.build_books bb     WHERE bb.project_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.groundwork_scopes g WHERE g.project_id = p.id);

  RAISE NOTICE 'Plan: delete % build_books across % projects (groundwork-only projects preserved).',
    v_bb_count, v_proj_count;

  -- 1. Projects we will fully tear down (own a build_book AND no groundwork_scope).
  CREATE TEMP TABLE _doomed_projects ON COMMIT DROP AS
  SELECT p.id
  FROM public.projects p
  WHERE p.user_id = me
    AND EXISTS (SELECT 1 FROM public.build_books bb     WHERE bb.project_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.groundwork_scopes g WHERE g.project_id = p.id);

  -- 2. All build_books we will delete (covers projects that ALSO have a groundwork_scope —
  --    those projects survive but lose the build_book).
  CREATE TEMP TABLE _doomed_build_books ON COMMIT DROP AS
  SELECT bb.id
  FROM public.build_books bb
  JOIN public.projects p ON p.id = bb.project_id
  WHERE p.user_id = me;

  -- 3. BB join tables (FK -> build_books).
  DELETE FROM public.build_book_moodboards
   WHERE build_book_id IN (SELECT id FROM _doomed_build_books);

  DELETE FROM public.build_book_rooms
   WHERE build_book_id IN (SELECT id FROM _doomed_build_books);

  -- 4. The build_books rows.
  DELETE FROM public.build_books
   WHERE id IN (SELECT id FROM _doomed_build_books);

  -- 5. For doomed projects: cascade-clean child data.
  DELETE FROM public.chat_messages
   WHERE chat_session_id IN (
     SELECT cs.id
     FROM public.chat_sessions cs
     JOIN public.room_designs rd ON rd.id = cs.room_design_id
     WHERE rd.project_id IN (SELECT id FROM _doomed_projects)
   );

  DELETE FROM public.chat_sessions
   WHERE room_design_id IN (
     SELECT id FROM public.room_designs
      WHERE project_id IN (SELECT id FROM _doomed_projects)
   );

  DELETE FROM public.room_designs
   WHERE project_id IN (SELECT id FROM _doomed_projects);

  DELETE FROM public.furniture_items
   WHERE room_id IN (SELECT id FROM public.rooms WHERE project_id IN (SELECT id FROM _doomed_projects));

  DELETE FROM public.design_suggestions
   WHERE room_id IN (SELECT id FROM public.rooms WHERE project_id IN (SELECT id FROM _doomed_projects));

  DELETE FROM public.room_photos
   WHERE room_id IN (SELECT id FROM public.rooms WHERE project_id IN (SELECT id FROM _doomed_projects));

  DELETE FROM public.room_scans
   WHERE room_id IN (SELECT id FROM public.rooms WHERE project_id IN (SELECT id FROM _doomed_projects));

  DELETE FROM public.rooms
   WHERE project_id IN (SELECT id FROM _doomed_projects);

  DELETE FROM public.inspiration_items
   WHERE project_id IN (SELECT id FROM _doomed_projects);

  DELETE FROM public.mood_boards
   WHERE project_id IN (SELECT id FROM _doomed_projects);

  DELETE FROM public.household_profiles
   WHERE project_id IN (SELECT id FROM _doomed_projects);

  -- 6. The projects themselves.
  DELETE FROM public.projects
   WHERE id IN (SELECT id FROM _doomed_projects);

  RAISE NOTICE 'Done. Build books wiped for user %.', me;
END $$;

-- Sanity check before committing.
SELECT
  (SELECT count(*) FROM public.build_books bb
     JOIN public.projects p ON p.id = bb.project_id
     WHERE p.user_id = '9f8a5dba-2890-4709-b137-04132ab84c03'::uuid) AS my_remaining_build_books,
  (SELECT count(*) FROM public.build_books bb
     JOIN public.projects p ON p.id = bb.project_id
     WHERE p.user_id = 'd985d8a2-1d42-42c9-8aed-1eac2a8b650e'::uuid) AS cofounder_build_books_unchanged,
  (SELECT count(*) FROM public.groundwork_scopes
     WHERE user_id = '9f8a5dba-2890-4709-b137-04132ab84c03'::uuid)   AS my_groundwork_scopes_preserved;

-- If the row above shows my_remaining_build_books = 0 and cofounder count unchanged: COMMIT.
-- Otherwise change to ROLLBACK and investigate.
COMMIT;