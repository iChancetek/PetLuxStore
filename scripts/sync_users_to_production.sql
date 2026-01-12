-- ONLY UPDATES - NO INSERTS
-- Correct password hashes for production
-- Case-insensitive email matching

UPDATE users 
SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$I/aBnDxwHym7Q+7bfsyu5A$29gANYX4tHWA3DDQBsBxi15Qhm6nHtrnca2fRqBJeqw'
WHERE LOWER(email) = LOWER('cm@chancellorminus.com');

UPDATE users 
SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$jr6wXBMNZ6W1K5zYFbzwoA$GENm7nNjRGzmZXx8J3ZxNET5dTyTFrxnHiWVhqPQVhg'
WHERE LOWER(email) = LOWER('chancellor@ichancetek.com');
