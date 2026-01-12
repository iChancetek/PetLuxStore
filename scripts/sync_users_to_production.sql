-- ONLY UPDATES - NO INSERTS
-- Development passwords override production

UPDATE users 
SET password_hash = dev.password_hash
FROM (VALUES 
    ('cm@chancellorminus.com', '$argon2id$v=19$m=65536,t=3,p=4$aKdKKT7OzwgswlW3TFiQnw$ewyOc+ppMlsOza4hw9OmsFgoiAn7fAQzO5IaqzP2pWk'),
    ('chancellor@ichancetek.com', '$argon2id$v=19$m=65536,t=3,p=4$MX5u6tnDDHb93/mDyZ0Eyg$S4Lq5IefspUd0C/9uWco0SyHFxASB/tOVLfn6955Yuo')
) AS dev(email, password_hash)
WHERE users.email = dev.email;
