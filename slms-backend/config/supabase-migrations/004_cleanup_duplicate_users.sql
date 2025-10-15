-- Migration: Cleanup duplicate users before testing
-- Date: 2025-10-14
-- Description: Remove duplicate users for marionunes, keeping only the most recent one with first_name and last_name

-- Show current duplicates
SELECT id, name, first_name, last_name, email, keycloak_id, last_login
FROM "Users"
WHERE name = 'marionunes'
ORDER BY last_login DESC;

-- Keep only the user with first_name and last_name populated (most recent)
-- Delete older duplicates
DELETE FROM "Users"
WHERE name = 'marionunes'
  AND id NOT IN (
    SELECT id FROM "Users"
    WHERE name = 'marionunes'
      AND first_name IS NOT NULL
      AND last_name IS NOT NULL
    LIMIT 1
  );

-- Verify cleanup
SELECT id, name, first_name, last_name, email, keycloak_id, last_login
FROM "Users"
WHERE name = 'marionunes';

-- Show all remaining users
SELECT id, name, first_name, last_name, email, keycloak_id, last_login
FROM "Users"
ORDER BY last_login DESC;
