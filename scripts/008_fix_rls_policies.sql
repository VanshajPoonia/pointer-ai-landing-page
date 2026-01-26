-- Fix RLS policies to ensure admin and regular users can query properly

-- Drop existing policies on users table
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "admin_all_users" ON public.users;

-- Create new policies that allow users to select their own data
-- and admins to select all data
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT
USING (
  auth.uid() = id OR 
  (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
);

CREATE POLICY "users_insert_policy" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE
USING (
  auth.uid() = id OR 
  (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
)
WITH CHECK (
  auth.uid() = id OR 
  (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
);

-- Create policies for code_snippets
DROP POLICY IF EXISTS "snippets_select" ON public.code_snippets;
DROP POLICY IF EXISTS "snippets_insert" ON public.code_snippets;
DROP POLICY IF EXISTS "snippets_update" ON public.code_snippets;
DROP POLICY IF EXISTS "snippets_delete" ON public.code_snippets;

CREATE POLICY "snippets_select_policy" ON public.code_snippets
FOR SELECT
USING (
  auth.uid() = user_id OR 
  (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
);

CREATE POLICY "snippets_insert_policy" ON public.code_snippets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "snippets_update_policy" ON public.code_snippets
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
);

CREATE POLICY "snippets_delete_policy" ON public.code_snippets
FOR DELETE
USING (
  auth.uid() = user_id OR 
  (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
);

-- Create policies for executions
DROP POLICY IF EXISTS "executions_select" ON public.executions;
DROP POLICY IF EXISTS "executions_insert" ON public.executions;

CREATE POLICY "executions_select_policy" ON public.executions
FOR SELECT
USING (
  auth.uid() = user_id OR 
  (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
);

CREATE POLICY "executions_insert_policy" ON public.executions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Verify policies were created
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
