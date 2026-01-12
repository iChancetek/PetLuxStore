-- User Sync Script for Production Database
-- Generated from development database
-- 
-- INSTRUCTIONS:
-- 1. Connect to your production database
-- 2. Run this script to sync users from development
-- 3. This uses UPSERT (INSERT ON CONFLICT) to safely update existing users
--    or insert new ones without duplicating data
--
-- SAFETY FEATURES:
-- - Only updates password_hash if the development value is NOT NULL
-- - Preserves existing operational fields (failed_login_attempts, last_login_at, locked_until)
-- - Uses COALESCE to keep production values when dev values are NULL
--
-- WARNING: Review before running on production
-- Make sure to backup your production database before running this script

BEGIN;

-- Sync users from development to production
-- Uses ON CONFLICT to update existing users or insert new ones
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    profile_image_url, 
    stripe_customer_id, 
    stripe_subscription_id, 
    role, 
    is_active, 
    password_hash, 
    email_verified, 
    email_verified_at, 
    locked_until, 
    failed_login_attempts, 
    last_login_at, 
    created_at, 
    updated_at, 
    deleted_at
) VALUES
-- User: cm@chancellorminus.com (Sydney Minus)
(
    'eb5446d3-4c7e-4a06-94cf-7fdae61040f3',
    'cm@chancellorminus.com',
    'Sydney',
    'Minus',
    NULL,
    NULL,
    NULL,
    'user',
    true,
    '$argon2id$v=19$m=65536,t=3,p=4$aKdKKT7OzwgswlW3TFiQnw$ewyOc+ppMlsOza4hw9OmsFgoiAn7fAQzO5IaqzP2pWk',
    false,
    NULL,
    NULL,
    0,
    NULL,
    '2025-10-30 05:51:04.36476',
    '2025-10-30 05:51:04.36476',
    NULL
),
-- User: chancellor@isynera.com (Admin)
(
    'user_34A3nBLyMag1ZLbmWUCNOKd6g9s',
    'chancellor@isynera.com',
    NULL,
    NULL,
    'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMmZSZEZJUzhIWWwxUVZvaXJHT2pud3hkWm8iLCJyaWQiOiJ1c2VyXzM0QTNuQkx5TWFnMVpMYm1XVUNOT0tkNmc5cyJ9',
    NULL,
    NULL,
    'admin',
    true,
    NULL,
    false,
    NULL,
    NULL,
    0,
    NULL,
    '2025-10-16 19:27:53.842888',
    '2025-10-17 15:14:56.817',
    NULL
),
-- User: Chancellor@isynera.com (Admin)
(
    '6bcdf034-bdf6-4b73-b3c0-516fdafe34e4',
    'Chancellor@isynera.com',
    'Chancellor',
    NULL,
    NULL,
    NULL,
    NULL,
    'admin',
    true,
    NULL,
    false,
    NULL,
    NULL,
    0,
    NULL,
    '2025-09-23 02:14:44.887476',
    '2025-09-23 02:14:44.887476',
    NULL
),
-- User: reviewer@example.com (Test Reviewer)
(
    '05e8baf2-63bd-46e2-b1f4-a2e5d946e5a3',
    'reviewer@example.com',
    'Test',
    'Reviewer',
    NULL,
    NULL,
    NULL,
    'reviewer',
    true,
    NULL,
    false,
    NULL,
    NULL,
    0,
    NULL,
    '2025-09-14 04:43:41.205431',
    '2025-09-14 04:43:41.205431',
    NULL
),
-- User: chancellor@ichancetek.com (Admin with password)
(
    'user_32ftxldMZBKdkyV3hoEywbiGhNN',
    'chancellor@ichancetek.com',
    NULL,
    NULL,
    'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMmZSZEZJUzhIWWwxUVZvaXJHT2pud3hkWm8iLCJyaWQiOiJ1c2VyXzMyZnR4bGRNWkJLZGt5VjNob0V5d2JpR2hOTiJ9',
    NULL,
    NULL,
    'admin',
    true,
    '$argon2id$v=19$m=65536,t=3,p=4$MX5u6tnDDHb93/mDyZ0Eyg$S4Lq5IefspUd0C/9uWco0SyHFxASB/tOVLfn6955Yuo',
    false,
    NULL,
    NULL,
    0,
    NULL,
    '2025-09-14 04:23:24.959081',
    '2025-10-16 19:23:36.444',
    NULL
),
-- User: regular@example.com (Regular User)
(
    'test-user-123',
    'regular@example.com',
    'Regular',
    'User',
    NULL,
    NULL,
    NULL,
    'user',
    true,
    NULL,
    false,
    NULL,
    NULL,
    0,
    NULL,
    '2025-09-14 00:45:27.227337',
    '2025-09-14 00:45:27.227337',
    NULL
),
-- User: GVuVfW@example.com (Admin)
(
    'GVuVfW',
    'GVuVfW@example.com',
    'John',
    'Doe',
    NULL,
    NULL,
    NULL,
    'admin',
    true,
    NULL,
    false,
    NULL,
    NULL,
    0,
    NULL,
    '2025-09-13 23:50:12.683401',
    '2025-09-13 23:50:12.683401',
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    profile_image_url = COALESCE(EXCLUDED.profile_image_url, users.profile_image_url),
    stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, users.stripe_customer_id),
    stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, users.stripe_subscription_id),
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    -- CRITICAL: Only update password_hash if the new value is NOT NULL
    -- This preserves existing production passwords when dev has no password set
    password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
    email_verified = EXCLUDED.email_verified,
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, users.email_verified_at),
    -- PRESERVE operational fields from production - do not overwrite with dev values
    locked_until = users.locked_until,
    failed_login_attempts = users.failed_login_attempts,
    last_login_at = users.last_login_at,
    updated_at = NOW();

COMMIT;

-- Verification query - run this after to confirm the sync
-- SELECT id, email, role, is_active, password_hash IS NOT NULL as has_password FROM users ORDER BY created_at DESC;
