BEGIN;

INSERT INTO users (id, email, first_name, last_name, profile_image_url, stripe_customer_id, stripe_subscription_id, role, is_active, password_hash, email_verified, email_verified_at, locked_until, failed_login_attempts, last_login_at, created_at, updated_at, deleted_at) VALUES
('eb5446d3-4c7e-4a06-94cf-7fdae61040f3', 'cm@chancellorminus.com', 'Sydney', 'Minus', NULL, NULL, NULL, 'user', true, '$argon2id$v=19$m=65536,t=3,p=4$aKdKKT7OzwgswlW3TFiQnw$ewyOc+ppMlsOza4hw9OmsFgoiAn7fAQzO5IaqzP2pWk', false, NULL, NULL, 0, NULL, '2025-10-30 05:51:04.36476', '2025-10-30 05:51:04.36476', NULL),
('user_34A3nBLyMag1ZLbmWUCNOKd6g9s', 'chancellor@isynera.com', NULL, NULL, 'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMmZSZEZJUzhIWWwxUVZvaXJHT2pud3hkWm8iLCJyaWQiOiJ1c2VyXzM0QTNuQkx5TWFnMVpMYm1XVUNOT0tkNmc5cyJ9', NULL, NULL, 'admin', true, NULL, false, NULL, NULL, 0, NULL, '2025-10-16 19:27:53.842888', '2025-10-17 15:14:56.817', NULL),
('05e8baf2-63bd-46e2-b1f4-a2e5d946e5a3', 'reviewer@example.com', 'Test', 'Reviewer', NULL, NULL, NULL, 'reviewer', true, NULL, false, NULL, NULL, 0, NULL, '2025-09-14 04:43:41.205431', '2025-09-14 04:43:41.205431', NULL),
('user_32ftxldMZBKdkyV3hoEywbiGhNN', 'chancellor@ichancetek.com', NULL, NULL, 'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMmZSZEZJUzhIWWwxUVZvaXJHT2pud3hkWm8iLCJyaWQiOiJ1c2VyXzMyZnR4bGRNWkJLZGt5VjNob0V5d2JpR2hOTiJ9', NULL, NULL, 'admin', true, '$argon2id$v=19$m=65536,t=3,p=4$MX5u6tnDDHb93/mDyZ0Eyg$S4Lq5IefspUd0C/9uWco0SyHFxASB/tOVLfn6955Yuo', false, NULL, NULL, 0, NULL, '2025-09-14 04:23:24.959081', '2025-10-16 19:23:36.444', NULL),
('test-user-123', 'regular@example.com', 'Regular', 'User', NULL, NULL, NULL, 'user', true, NULL, false, NULL, NULL, 0, NULL, '2025-09-14 00:45:27.227337', '2025-09-14 00:45:27.227337', NULL),
('GVuVfW', 'GVuVfW@example.com', 'John', 'Doe', NULL, NULL, NULL, 'admin', true, NULL, false, NULL, NULL, 0, NULL, '2025-09-13 23:50:12.683401', '2025-09-13 23:50:12.683401', NULL)
ON CONFLICT (email) DO UPDATE SET
first_name = COALESCE(EXCLUDED.first_name, users.first_name),
last_name = COALESCE(EXCLUDED.last_name, users.last_name),
profile_image_url = COALESCE(EXCLUDED.profile_image_url, users.profile_image_url),
role = EXCLUDED.role,
is_active = EXCLUDED.is_active,
password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
updated_at = NOW();

COMMIT;
