-- Row-Level Security + helpful columns for the inspiration / idea-boards
-- system. The tables themselves were created earlier; this migration only
-- adds RLS policies + an "intake" tag we use to find/create the implicit
-- mood board the Groundwork intake writes to, plus indexes and an
-- updated_at trigger for mood_boards.

------------------------------------------------------------
-- mood_boards
------------------------------------------------------------
alter table if exists public.mood_boards
  add column if not exists source text;
-- "intake" => board automatically created by the Groundwork intake step.
-- "pinterest" => board imported from Pinterest.
-- null/other => user-created from the dashboard.

create index if not exists mood_boards_user_id_idx
  on public.mood_boards (user_id);
create index if not exists mood_boards_project_id_idx
  on public.mood_boards (project_id);
create index if not exists mood_boards_project_source_idx
  on public.mood_boards (project_id, source);

alter table public.mood_boards enable row level security;

drop policy if exists "mood_boards_select_own" on public.mood_boards;
create policy "mood_boards_select_own"
  on public.mood_boards for select
  using (auth.uid() = user_id);

drop policy if exists "mood_boards_insert_own" on public.mood_boards;
create policy "mood_boards_insert_own"
  on public.mood_boards for insert
  with check (auth.uid() = user_id);

drop policy if exists "mood_boards_update_own" on public.mood_boards;
create policy "mood_boards_update_own"
  on public.mood_boards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "mood_boards_delete_own" on public.mood_boards;
create policy "mood_boards_delete_own"
  on public.mood_boards for delete
  using (auth.uid() = user_id);

create or replace function public.set_mood_boards_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists mood_boards_set_updated_at on public.mood_boards;
create trigger mood_boards_set_updated_at
  before update on public.mood_boards
  for each row execute function public.set_mood_boards_updated_at();

------------------------------------------------------------
-- inspiration_items
------------------------------------------------------------
-- inspiration_items has project_id but no user_id column. We gate access
-- through the parent project's user_id.
create index if not exists inspiration_items_project_id_idx
  on public.inspiration_items (project_id);
create index if not exists inspiration_items_mood_board_id_idx
  on public.inspiration_items (mood_board_id);

alter table public.inspiration_items enable row level security;

drop policy if exists "inspiration_items_select_own" on public.inspiration_items;
create policy "inspiration_items_select_own"
  on public.inspiration_items for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = inspiration_items.project_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "inspiration_items_insert_own" on public.inspiration_items;
create policy "inspiration_items_insert_own"
  on public.inspiration_items for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = inspiration_items.project_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "inspiration_items_update_own" on public.inspiration_items;
create policy "inspiration_items_update_own"
  on public.inspiration_items for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = inspiration_items.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = inspiration_items.project_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "inspiration_items_delete_own" on public.inspiration_items;
create policy "inspiration_items_delete_own"
  on public.inspiration_items for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = inspiration_items.project_id
        and p.user_id = auth.uid()
    )
  );
