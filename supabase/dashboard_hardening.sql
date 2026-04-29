-- =============================================================
-- Before The Build — Dashboard hardening
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- Adds RLS, updated_at triggers, indexes, and storage policies
-- for every table the web app reads/writes from.
-- (groundwork_scopes is already covered by groundwork_scopes_setup.sql)
-- =============================================================

-- -------------------------------------------------------------
-- 0. Generic updated_at trigger function (shared)
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- -------------------------------------------------------------
-- 1. projects
-- -------------------------------------------------------------
alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index if not exists projects_user_id_idx       on public.projects (user_id);
create index if not exists projects_updated_at_idx    on public.projects (updated_at desc);

-- -------------------------------------------------------------
-- 2. rooms (owned via projects.user_id)
-- -------------------------------------------------------------
alter table public.rooms enable row level security;

drop policy if exists "rooms_select_own" on public.rooms;
drop policy if exists "rooms_insert_own" on public.rooms;
drop policy if exists "rooms_update_own" on public.rooms;
drop policy if exists "rooms_delete_own" on public.rooms;

create policy "rooms_select_own" on public.rooms for select
  using (exists (select 1 from public.projects p where p.id = rooms.project_id and p.user_id = auth.uid()));
create policy "rooms_insert_own" on public.rooms for insert
  with check (exists (select 1 from public.projects p where p.id = rooms.project_id and p.user_id = auth.uid()));
create policy "rooms_update_own" on public.rooms for update
  using (exists (select 1 from public.projects p where p.id = rooms.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = rooms.project_id and p.user_id = auth.uid()));
create policy "rooms_delete_own" on public.rooms for delete
  using (exists (select 1 from public.projects p where p.id = rooms.project_id and p.user_id = auth.uid()));

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

create index if not exists rooms_project_id_idx on public.rooms (project_id);
create index if not exists rooms_type_idx       on public.rooms (type);

-- -------------------------------------------------------------
-- 3. room_photos
-- -------------------------------------------------------------
alter table public.room_photos enable row level security;

drop policy if exists "room_photos_select_own" on public.room_photos;
drop policy if exists "room_photos_insert_own" on public.room_photos;
drop policy if exists "room_photos_delete_own" on public.room_photos;

create policy "room_photos_select_own" on public.room_photos for select
  using (exists (
    select 1 from public.rooms r
    join public.projects p on p.id = r.project_id
    where r.id = room_photos.room_id and p.user_id = auth.uid()
  ));
create policy "room_photos_insert_own" on public.room_photos for insert
  with check (exists (
    select 1 from public.rooms r
    join public.projects p on p.id = r.project_id
    where r.id = room_photos.room_id and p.user_id = auth.uid()
  ));
create policy "room_photos_delete_own" on public.room_photos for delete
  using (exists (
    select 1 from public.rooms r
    join public.projects p on p.id = r.project_id
    where r.id = room_photos.room_id and p.user_id = auth.uid()
  ));

create index if not exists room_photos_room_id_idx    on public.room_photos (room_id);
create index if not exists room_photos_created_at_idx on public.room_photos (created_at desc);

-- -------------------------------------------------------------
-- 4. build_books
-- -------------------------------------------------------------
alter table public.build_books enable row level security;

drop policy if exists "build_books_select_own" on public.build_books;
drop policy if exists "build_books_insert_own" on public.build_books;
drop policy if exists "build_books_update_own" on public.build_books;
drop policy if exists "build_books_delete_own" on public.build_books;

create policy "build_books_select_own" on public.build_books for select
  using (exists (select 1 from public.projects p where p.id = build_books.project_id and p.user_id = auth.uid()));
create policy "build_books_insert_own" on public.build_books for insert
  with check (exists (select 1 from public.projects p where p.id = build_books.project_id and p.user_id = auth.uid()));
create policy "build_books_update_own" on public.build_books for update
  using (exists (select 1 from public.projects p where p.id = build_books.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = build_books.project_id and p.user_id = auth.uid()));
create policy "build_books_delete_own" on public.build_books for delete
  using (exists (select 1 from public.projects p where p.id = build_books.project_id and p.user_id = auth.uid()));

drop trigger if exists build_books_set_updated_at on public.build_books;
create trigger build_books_set_updated_at
  before update on public.build_books
  for each row execute function public.set_updated_at();

create index if not exists build_books_project_id_idx on public.build_books (project_id);
create index if not exists build_books_updated_at_idx on public.build_books (updated_at desc);

-- -------------------------------------------------------------
-- 5. mood_boards
-- -------------------------------------------------------------
alter table public.mood_boards enable row level security;

drop policy if exists "mood_boards_select_own" on public.mood_boards;
drop policy if exists "mood_boards_insert_own" on public.mood_boards;
drop policy if exists "mood_boards_update_own" on public.mood_boards;
drop policy if exists "mood_boards_delete_own" on public.mood_boards;

create policy "mood_boards_select_own" on public.mood_boards for select using (auth.uid() = user_id);
create policy "mood_boards_insert_own" on public.mood_boards for insert with check (auth.uid() = user_id);
create policy "mood_boards_update_own" on public.mood_boards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mood_boards_delete_own" on public.mood_boards for delete using (auth.uid() = user_id);

drop trigger if exists mood_boards_set_updated_at on public.mood_boards;
create trigger mood_boards_set_updated_at
  before update on public.mood_boards
  for each row execute function public.set_updated_at();

create index if not exists mood_boards_user_id_idx    on public.mood_boards (user_id);
create index if not exists mood_boards_project_id_idx on public.mood_boards (project_id);

-- -------------------------------------------------------------
-- 6. inspiration_items
-- -------------------------------------------------------------
alter table public.inspiration_items enable row level security;

drop policy if exists "inspiration_items_select_own" on public.inspiration_items;
drop policy if exists "inspiration_items_insert_own" on public.inspiration_items;
drop policy if exists "inspiration_items_update_own" on public.inspiration_items;
drop policy if exists "inspiration_items_delete_own" on public.inspiration_items;

create policy "inspiration_items_select_own" on public.inspiration_items for select
  using (exists (select 1 from public.projects p where p.id = inspiration_items.project_id and p.user_id = auth.uid()));
create policy "inspiration_items_insert_own" on public.inspiration_items for insert
  with check (exists (select 1 from public.projects p where p.id = inspiration_items.project_id and p.user_id = auth.uid()));
create policy "inspiration_items_update_own" on public.inspiration_items for update
  using (exists (select 1 from public.projects p where p.id = inspiration_items.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = inspiration_items.project_id and p.user_id = auth.uid()));
create policy "inspiration_items_delete_own" on public.inspiration_items for delete
  using (exists (select 1 from public.projects p where p.id = inspiration_items.project_id and p.user_id = auth.uid()));

create index if not exists inspiration_items_project_id_idx    on public.inspiration_items (project_id);
create index if not exists inspiration_items_mood_board_id_idx on public.inspiration_items (mood_board_id);

-- -------------------------------------------------------------
-- 7. Storage bucket: room-photos
--    Public read so <Image> can render; writes/deletes restricted.
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "room_photos_public_read" on storage.objects;
drop policy if exists "room_photos_user_insert" on storage.objects;
drop policy if exists "room_photos_user_update" on storage.objects;
drop policy if exists "room_photos_user_delete" on storage.objects;

create policy "room_photos_public_read" on storage.objects
  for select using (bucket_id = 'room-photos');
create policy "room_photos_user_insert" on storage.objects
  for insert with check (bucket_id = 'room-photos' and auth.uid() is not null);
create policy "room_photos_user_update" on storage.objects
  for update using (bucket_id = 'room-photos' and auth.uid() = owner)
  with check (bucket_id = 'room-photos' and auth.uid() = owner);
create policy "room_photos_user_delete" on storage.objects
  for delete using (bucket_id = 'room-photos' and auth.uid() = owner);

-- =============================================================
-- Verify with:
--   select tablename, rowsecurity from pg_tables where schemaname = 'public';
--   select * from pg_policies where schemaname = 'public';
-- =============================================================
