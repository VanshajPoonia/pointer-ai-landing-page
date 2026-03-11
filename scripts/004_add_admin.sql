-- Add is_admin column to users table
alter table public.users add column if not exists is_admin boolean default false;

-- Update RLS policies to allow admin to see all data
drop policy if exists "snippets_select_own" on public.code_snippets;
create policy "snippets_select_own" on public.code_snippets 
  for select 
  using (
    auth.uid() = user_id 
    or 
    exists (
      select 1 from public.users 
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users 
  for select 
  using (
    auth.uid() = id 
    or 
    exists (
      select 1 from public.users 
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "executions_select_own" on public.executions;
create policy "executions_select_own" on public.executions 
  for select 
  using (
    auth.uid() = user_id 
    or 
    exists (
      select 1 from public.users 
      where id = auth.uid() and is_admin = true
    )
  );

-- Set admin for vanshaj@vanshajpoonia.com
-- This will be set automatically when the user signs up with this email
