-- Initial schema for Before The Build

create extension if not exists "uuid-ossp";

create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  budget numeric,
  status text default 'planning' check (status in ('planning', 'in_progress', 'completed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('kitchen', 'bathroom', 'bedroom', 'living_room', 'dining_room', 'garage', 'basement', 'outdoor', 'other')),
  width numeric,
  height numeric,
  length numeric,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.room_photos (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  storage_path text not null,
  created_at timestamptz default now() not null
);

create table public.design_suggestions (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  style text not null,
  description text not null,
  estimated_cost numeric,
  image_url text,
  created_at timestamptz default now() not null
);

alter table public.projects enable row level security;
alter table public.rooms enable row level security;
alter table public.room_photos enable row level security;
alter table public.design_suggestions enable row level security;

create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);
create policy "Users can create own projects" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

create policy "Users can view own rooms" on public.rooms
  for select using (exists (select 1 from public.projects where projects.id = rooms.project_id and projects.user_id = auth.uid()));
create policy "Users can create rooms in own projects" on public.rooms
  for insert with check (exists (select 1 from public.projects where projects.id = rooms.project_id and projects.user_id = auth.uid()));
create policy "Users can update own rooms" on public.rooms
  for update using (exists (select 1 from public.projects where projects.id = rooms.project_id and projects.user_id = auth.uid()));
create policy "Users can delete own rooms" on public.rooms
  for delete using (exists (select 1 from public.projects where projects.id = rooms.project_id and projects.user_id = auth.uid()));
