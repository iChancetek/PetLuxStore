-- ONLY UPDATES - NO INSERTS
-- Development passwords override production
-- Case-insensitive email matching

UPDATE users 
SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$aKdKKT7OzwgswlW3TFiQnw$ewyOc+ppMlsOza4hw9OmsFgoiAn7fAQzO5IaqzP2pWk'
WHERE LOWER(email) = LOWER('cm@chancellorminus.com');

UPDATE users 
SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$MX5u6tnDDHb93/mDyZ0Eyg$S4Lq5IefspUd0C/9uWco0SyHFxASB/tOVLfn6955Yuo'
WHERE LOWER(email) = LOWER('chancellor@ichancetek.com');
