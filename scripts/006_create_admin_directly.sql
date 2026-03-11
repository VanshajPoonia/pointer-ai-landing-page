-- This script creates the admin user directly in the database
-- bypassing Supabase API rate limits
-- Email: vanshaj@vanshajpoonia.com
-- Password: admin123

DO $$
DECLARE
    admin_id uuid := gen_random_uuid();
    admin_email text := 'vanshaj@vanshajpoonia.com';
    -- This is bcrypt hash for 'admin123'
    password_hash text := '$2a$10$xvW5Qq5Tz5Ln9Z4f4xB4xOYvJ0yXqvW5E8Z5J5Z5Z5Z5Z5Z5Z5Z5Ze';
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        -- Update existing user
        SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
        
        UPDATE auth.users
        SET 
            encrypted_password = crypt('admin123', gen_salt('bf')),
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE email = admin_email;
        
        -- Try to update confirmed_at if possible
        BEGIN
            UPDATE auth.users 
            SET confirmed_at = NOW() 
            WHERE email = admin_email;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not update confirmed_at, but continuing...';
        END;
        
        RAISE NOTICE 'Updated existing user: %', admin_email;
    ELSE
        -- Insert new user (without confirmed_at in initial insert)
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role
        ) VALUES (
            admin_id,
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            'authenticated',
            'authenticated'
        );
        
        RAISE NOTICE 'Created new user: %', admin_email;
    END IF;

    -- Get the actual user ID (in case of conflict)
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

    -- Insert or update public.users table
    INSERT INTO public.users (
        id,
        email,
        is_admin,
        is_premium,
        free_executions_remaining,
        created_at
    ) VALUES (
        admin_id,
        admin_email,
        true,
        true,
        999999,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        is_admin = true,
        is_premium = true,
        free_executions_remaining = 999999;

    RAISE NOTICE 'Admin user created/updated successfully!';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: admin123';
    RAISE NOTICE 'You can now login at /auth/login';
END $$;

-- Verify the admin user was created
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.is_admin,
    p.is_premium,
    p.free_executions_remaining
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email = 'vanshaj@vanshajpoonia.com';
