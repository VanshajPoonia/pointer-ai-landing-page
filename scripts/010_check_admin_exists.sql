-- Check if admin user exists in both auth and public tables

-- Check auth.users table
SELECT 
    'auth.users' as table_name,
    id, 
    email, 
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'vanshaj@vanshajpoonia.com';

-- Check public.users table
SELECT 
    'public.users' as table_name,
    id, 
    email, 
    is_admin,
    is_premium,
    free_executions_remaining,
    created_at
FROM public.users
WHERE email = 'vanshaj@vanshajpoonia.com';

-- Count total users in public.users
SELECT 'Total users in public.users' as info, COUNT(*) as count
FROM public.users;
