-- This script sets a user as admin after they've signed up
-- First, the user needs to sign up normally at /auth/sign-up with:
-- Email: vanshaj@vanshajpoonia.com
-- Password: admin123

-- Then run this script to make them admin
-- Replace 'vanshaj@vanshajpoonia.com' with the actual email if different

UPDATE public.users
SET is_admin = true, is_paid = true
WHERE email = 'vanshaj@vanshajpoonia.com';

-- Verify the update
SELECT id, email, is_admin, is_paid, execution_count
FROM public.users
WHERE email = 'vanshaj@vanshajpoonia.com';
