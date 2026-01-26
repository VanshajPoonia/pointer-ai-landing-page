-- Verify admin user exists and is properly configured
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at as auth_created_at,
    p.email as profile_email,
    p.is_admin,
    p.is_premium,
    p.free_executions_remaining,
    p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email = 'vanshaj@vanshajpoonia.com';
