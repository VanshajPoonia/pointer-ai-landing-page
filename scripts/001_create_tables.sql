-- Create users table extension
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  free_executions_remaining integer default 100,
  is_premium boolean default false,
  coffee_email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create code_snippets table
create table if not exists public.code_snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  language text not null,
  code text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create executions table for tracking usage
create table if not exists public.executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  language text not null,
  execution_time integer,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.code_snippets enable row level security;
alter table public.executions enable row level security;

-- RLS Policies for users
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- RLS Policies for code_snippets
create policy "snippets_select_own" on public.code_snippets for select using (auth.uid() = user_id);
create policy "snippets_insert_own" on public.code_snippets for insert with check (auth.uid() = user_id);
create policy "snippets_update_own" on public.code_snippets for update using (auth.uid() = user_id);
create policy "snippets_delete_own" on public.code_snippets for delete using (auth.uid() = user_id);

-- RLS Policies for executions
create policy "executions_select_own" on public.executions for select using (auth.uid() = user_id);
create policy "executions_insert_own" on public.executions for insert with check (auth.uid() = user_id);
