-- Idempotent setup for groundwork_scopes (safe to re-run).
-- Adds RLS policies, updated_at trigger, and supporting indexes.
-- The table itself already exists with the right columns.

-- 1. Make sure RLS is on
alter table public.groundwork_scopes enable row level security;

-- 2. Policies (drop + recreate so re-runs stay clean)
drop policy if exists "groundwork_scopes_select_own" on public.groundwork_scopes;
drop policy if exists "groundwork_scopes_insert_own" on public.groundwork_scopes;
drop policy if exists "groundwork_scopes_update_own" on public.groundwork_scopes;
drop policy if exists "groundwork_scopes_delete_own" on public.groundwork_scopes;

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

-- 3. updated_at trigger
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

-- 4. Indexes the dashboard queries rely on
create index if not exists groundwork_scopes_user_id_idx
  on public.groundwork_scopes (user_id);

create index if not exists groundwork_scopes_updated_at_idx
  on public.groundwork_scopes (updated_at desc);
