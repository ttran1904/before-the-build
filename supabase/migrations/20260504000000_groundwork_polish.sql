-- ============================================================
-- Groundwork polish migration
-- ------------------------------------------------------------
-- Idempotent additive migration. Safe to paste into the Supabase
-- SQL Editor and run multiple times.
--
-- What this does
--   1. Adds two columns to public.groundwork_scopes for query-friendly
--      access to fields the app already stores inside `data` (jsonb):
--        - urgency        -- "asap" | "soonish" | "no_rush"
--        - readiness_score (numeric, 0-100) -- cached overall readiness
--   2. Adds helpful indexes for the dashboard-style queries the
--      app issues today.
--   3. Makes sure Row Level Security is on and that each user can only
--      read/write their own groundwork rows.
--
-- What this does NOT do
--   - No destructive changes. No column drops. No data migration.
--   - It does NOT alter `data jsonb`; the existing app code continues
--     to read from there. The new columns are an optimization.
-- ============================================================

-- 1. Additive columns ----------------------------------------------------

ALTER TABLE public.groundwork_scopes
  ADD COLUMN IF NOT EXISTS urgency text;

ALTER TABLE public.groundwork_scopes
  ADD COLUMN IF NOT EXISTS readiness_score numeric;

COMMENT ON COLUMN public.groundwork_scopes.urgency IS
  'Promoted from data->>''urgency''. One of: asap, soonish, no_rush.';

COMMENT ON COLUMN public.groundwork_scopes.readiness_score IS
  'Cached overall readiness (0-100) from the bathroom readiness graph.';


-- 2. Indexes -------------------------------------------------------------

-- Used by the "load my latest scope" query.
CREATE INDEX IF NOT EXISTS groundwork_scopes_user_updated_idx
  ON public.groundwork_scopes (user_id, updated_at DESC);

-- Useful for analytics + filtering.
CREATE INDEX IF NOT EXISTS groundwork_scopes_project_type_idx
  ON public.groundwork_scopes (project_type);

CREATE INDEX IF NOT EXISTS groundwork_scopes_bathroom_kind_idx
  ON public.groundwork_scopes (bathroom_kind);

CREATE INDEX IF NOT EXISTS groundwork_scopes_budget_tier_idx
  ON public.groundwork_scopes (budget_tier);

CREATE INDEX IF NOT EXISTS groundwork_scopes_urgency_idx
  ON public.groundwork_scopes (urgency);


-- 3. Row Level Security --------------------------------------------------

ALTER TABLE public.groundwork_scopes ENABLE ROW LEVEL SECURITY;

-- Each policy is wrapped in a DO block so re-running this script
-- doesn't error if the policy already exists.
DO $$ BEGIN
  CREATE POLICY "groundwork_scopes_select_own"
    ON public.groundwork_scopes
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "groundwork_scopes_insert_own"
    ON public.groundwork_scopes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "groundwork_scopes_update_own"
    ON public.groundwork_scopes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "groundwork_scopes_delete_own"
    ON public.groundwork_scopes
    FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- 4. Backfill (best-effort, no-op when columns are still null) -----------

UPDATE public.groundwork_scopes
SET urgency = data->>'urgency'
WHERE urgency IS NULL
  AND data ? 'urgency'
  AND data->>'urgency' <> '';
