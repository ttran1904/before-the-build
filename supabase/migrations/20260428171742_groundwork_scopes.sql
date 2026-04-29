-- Groundwork Scope per project (1:1 with projects).
-- Standalone product: stores the contractor brief as a JSON blob plus
-- the helpful columns we need to filter/list/order on the dashboard.

create table if not exists public.groundwork_scopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  -- Full GroundworkBathroomState shape lives here so the wizard can grow
  -- without schema churn.
  data jsonb not null default '{}'::jsonb,
  -- Mirrored helpful columns
  project_type text,
  bathroom_kind text,
  budget_tier text,
  has_content boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id)
);

create index if not exists groundwork_scopes_user_id_idx
  on public.groundwork_scopes (user_id);
create index if not exists groundwork_scopes_updated_at_idx
  on public.groundwork_scopes (updated_at desc);

alter table public.groundwork_scopes enable row level security;

create policy "groundwork_scopes_select_own"
  on public.groundwork_scopes for select
  using (auth.uid() = user_id);

create policy "groundwork_scopes_insert_own"
  on public.groundwork_scopes for insert
  with check (auth.uid() = user_id);

create policy "groundwork_scopes_update_own"
  on public.groundwork_scopes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "groundwork_scopes_delete_own"
  on public.groundwork_scopes for delete
  using (auth.uid() = user_id);

-- Auto-bump updated_at
create or replace function public.set_groundwork_scopes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists groundwork_scopes_set_updated_at on public.groundwork_scopes;
create trigger groundwork_scopes_set_updated_at
  before update on public.groundwork_scopes
  for each row execute function public.set_groundwork_scopes_updated_at();