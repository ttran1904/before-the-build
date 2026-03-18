-- Migration: household profiles, goals, inspiration, designs, chat, build book
-- Extends the initial schema with full app features

-- ============================================================
-- Household Profiles
-- ============================================================
create table if not exists public.household_profiles (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null unique,
  adults integer not null default 1,
  children integer not null default 0,
  pets jsonb not null default '[]',
  habits text[] not null default '{}',
  special_needs text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Project goals & preferences (extend projects table)
-- ============================================================
alter table public.projects
  add column if not exists goals text[] not null default '{}',
  add column if not exists must_haves text[] not null default '{}',
  add column if not exists nice_to_haves text[] not null default '{}',
  add column if not exists preferred_styles text[] not null default '{}';

-- ============================================================
-- Inspiration Items & Mood Boards
-- ============================================================
create table if not exists public.mood_boards (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.inspiration_items (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  mood_board_id uuid references public.mood_boards(id) on delete set null,
  source text not null check (source in ('pinterest', 'instagram', 'google', 'etsy', 'house_tour', 'resort', 'magazine', 'upload')),
  image_url text not null,
  source_url text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Room Scans
-- ============================================================
create table if not exists public.room_scans (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  mesh_url text,
  floor_plan_url text,
  anchor_points jsonb not null default '[]',
  scanned_at timestamptz default now() not null
);

-- ============================================================
-- Furniture Items (catalog + existing items in rooms)
-- ============================================================
create table if not exists public.furniture_items (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade,
  name text not null,
  category text not null check (category in ('seating', 'tables', 'storage', 'lighting', 'decor', 'rugs', 'window_treatments', 'appliances', 'fixtures', 'other')),
  brand text,
  price numeric,
  image_url text,
  product_url text,
  width numeric,
  height numeric,
  depth numeric,
  is_existing boolean not null default false,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Room Designs (2D/3D layouts)
-- ============================================================
create table if not exists public.room_designs (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  layout_2d jsonb not null default '{}',
  layout_3d jsonb,
  placed_items jsonb not null default '[]',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- AI Chat Sessions & Messages
-- ============================================================
create table if not exists public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  room_design_id uuid references public.room_designs(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  chat_session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Build Book (final review)
-- ============================================================
create table if not exists public.build_books (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null unique,
  scope_description text not null default '',
  total_estimated_cost numeric not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.build_book_rooms (
  id uuid default uuid_generate_v4() primary key,
  build_book_id uuid references public.build_books(id) on delete cascade not null,
  room_id uuid references public.rooms(id) on delete cascade not null,
  layout_2d_url text,
  layout_3d_url text,
  items_list jsonb not null default '[]',
  room_estimated_cost numeric not null default 0,
  notes text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Row Level Security for new tables
-- ============================================================
alter table public.household_profiles enable row level security;
alter table public.mood_boards enable row level security;
alter table public.inspiration_items enable row level security;
alter table public.room_scans enable row level security;
alter table public.furniture_items enable row level security;
alter table public.room_designs enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.build_books enable row level security;
alter table public.build_book_rooms enable row level security;

-- Helper: check if user owns the project
create or replace function public.user_owns_project(p_project_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.projects where id = p_project_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Policies (drop + recreate to be idempotent)
do $$ begin
  -- household_profiles
  drop policy if exists "Users can manage own household profiles" on public.household_profiles;
  create policy "Users can manage own household profiles" on public.household_profiles
    for all using (public.user_owns_project(project_id));

  -- mood_boards
  drop policy if exists "Users can manage own mood boards" on public.mood_boards;
  create policy "Users can manage own mood boards" on public.mood_boards
    for all using (public.user_owns_project(project_id));

  -- inspiration_items
  drop policy if exists "Users can manage own inspiration items" on public.inspiration_items;
  create policy "Users can manage own inspiration items" on public.inspiration_items
    for all using (public.user_owns_project(project_id));

  -- room_scans
  drop policy if exists "Users can manage own room scans" on public.room_scans;
  create policy "Users can manage own room scans" on public.room_scans
    for all using (
      exists (
        select 1 from public.rooms r
        join public.projects p on p.id = r.project_id
        where r.id = room_scans.room_id and p.user_id = auth.uid()
      )
    );

  -- furniture_items
  drop policy if exists "Users can manage own furniture items" on public.furniture_items;
  create policy "Users can manage own furniture items" on public.furniture_items
    for all using (
      room_id is null or exists (
        select 1 from public.rooms r
        join public.projects p on p.id = r.project_id
        where r.id = furniture_items.room_id and p.user_id = auth.uid()
      )
    );

  -- room_designs
  drop policy if exists "Users can manage own room designs" on public.room_designs;
  create policy "Users can manage own room designs" on public.room_designs
    for all using (public.user_owns_project(project_id));

  -- chat_sessions
  drop policy if exists "Users can manage own chat sessions" on public.chat_sessions;
  create policy "Users can manage own chat sessions" on public.chat_sessions
    for all using (
      exists (
        select 1 from public.room_designs rd
        join public.projects p on p.id = rd.project_id
        where rd.id = chat_sessions.room_design_id and p.user_id = auth.uid()
      )
    );

  -- chat_messages
  drop policy if exists "Users can manage own chat messages" on public.chat_messages;
  create policy "Users can manage own chat messages" on public.chat_messages
    for all using (
      exists (
        select 1 from public.chat_sessions cs
        join public.room_designs rd on rd.id = cs.room_design_id
        join public.projects p on p.id = rd.project_id
        where cs.id = chat_messages.chat_session_id and p.user_id = auth.uid()
      )
    );

  -- build_books
  drop policy if exists "Users can manage own build books" on public.build_books;
  create policy "Users can manage own build books" on public.build_books
    for all using (public.user_owns_project(project_id));

  -- build_book_rooms
  drop policy if exists "Users can manage own build book rooms" on public.build_book_rooms;
  create policy "Users can manage own build book rooms" on public.build_book_rooms
    for all using (
      exists (
        select 1 from public.build_books bb
        join public.projects p on p.id = bb.project_id
        where bb.id = build_book_rooms.build_book_id and p.user_id = auth.uid()
      )
    );
end $$;

-- ============================================================
-- Updated_at triggers
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.rooms;
create trigger set_updated_at before update on public.rooms
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.household_profiles;
create trigger set_updated_at before update on public.household_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.mood_boards;
create trigger set_updated_at before update on public.mood_boards
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.room_designs;
create trigger set_updated_at before update on public.room_designs
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.chat_sessions;
create trigger set_updated_at before update on public.chat_sessions
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.build_books;
create trigger set_updated_at before update on public.build_books
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('room-photos', 'room-photos', false),
  ('room-scans', 'room-scans', false),
  ('inspiration', 'inspiration', false),
  ('design-exports', 'design-exports', false)
on conflict (id) do nothing;
