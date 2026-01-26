-- This script sets a user as admin and confirms their email
-- Instructions:
-- 1. Sign up at /auth/sign-up with ANY valid email and password (e.g., admin@test.com / admin123)
-- 2. Replace 'YOUR_EMAIL_HERE' below with the email you used
-- 3. Run this script to make that user admin and confirm their email

-- IMPORTANT: Replace 'YOUR_EMAIL_HERE' with your actual signup email
DO $$
DECLARE
    admin_email text := 'YOUR_EMAIL_HERE'; -- Change this to your signup email
    user_id uuid;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = admin_email;

    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found. Please sign up first with email: %', admin_email;
    ELSE
        -- Confirm the email in auth.users
        UPDATE auth.users
        SET email_confirmed_at = NOW(),
            confirmed_at = NOW()
        WHERE id = user_id;

        -- Set user as admin and paid in public.users
        UPDATE public.users
        SET is_admin = true, 
            is_paid = true
        WHERE id = user_id;

        RAISE NOTICE 'User % has been set as admin and email confirmed!', admin_email;
    END IF;
END $$;

-- Verify the update
SELECT u.id, u.email, u.email_confirmed_at, p.is_admin, p.is_paid, p.execution_count
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email = 'YOUR_EMAIL_HERE'; -- Change this to match above
