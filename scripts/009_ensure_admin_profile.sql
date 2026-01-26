-- Ensure the admin user has a profile in public.users table
-- This fixes the "Database error querying schema" issue

DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'vanshaj@vanshajpoonia.com';
BEGIN
    -- Get the admin user ID from auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;

    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found in auth.users with email: %', admin_email;
    ELSE
        -- Check if profile exists in public.users
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id) THEN
            -- Create the profile
            INSERT INTO public.users (
                id,
                email,
                is_admin,
                is_premium,
                free_executions_remaining,
                created_at
            ) VALUES (
                admin_user_id,
                admin_email,
                true,
                true,
                999999,
                NOW()
            );
            RAISE NOTICE 'Created profile for admin user: %', admin_email;
        ELSE
            -- Update existing profile to ensure admin flags
            UPDATE public.users
            SET 
                is_admin = true,
                is_premium = true,
                free_executions_remaining = 999999,
                email = admin_email
            WHERE id = admin_user_id;
            RAISE NOTICE 'Updated existing profile for admin user: %', admin_email;
        END IF;
    END IF;
END $$;

-- Verify the profile exists
SELECT 
    u.id,
    u.email as auth_email,
    u.email_confirmed_at,
    p.email as profile_email,
    p.is_admin,
    p.is_premium,
    p.free_executions_remaining
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email = 'vanshaj@vanshajpoonia.com';
