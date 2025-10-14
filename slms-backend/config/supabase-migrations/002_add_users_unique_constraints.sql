-- Migration: Add UNIQUE constraints to Users table
-- This ensures no duplicate users are created

-- Step 1: Check for duplicate keycloak_ids (before adding UNIQUE constraint)
SELECT keycloak_id, COUNT(*) as count
FROM "Users"
WHERE keycloak_id IS NOT NULL
GROUP BY keycloak_id
HAVING COUNT(*) > 1;

-- Step 2: Check for duplicate users (before adding UNIQUE constraint)
SELECT user, COUNT(*) as count
FROM "Users"
WHERE user IS NOT NULL
GROUP BY user
HAVING COUNT(*) > 1;

-- Step 3: If duplicates exist, keep only the most recent (highest id or latest last_login)
-- Delete older duplicates by keycloak_id
DELETE FROM "Users" u1
WHERE EXISTS (
    SELECT 1 FROM "Users" u2
    WHERE u1.keycloak_id = u2.keycloak_id
    AND u1.keycloak_id IS NOT NULL
    AND (
        u1.id < u2.id  -- Keep the one with higher id
        OR (u1.id = u2.id AND u1.last_login < u2.last_login)  -- Or more recent login
    )
);

-- Step 4: Delete older duplicates by user
DELETE FROM "Users" u1
WHERE EXISTS (
    SELECT 1 FROM "Users" u2
    WHERE u1.user = u2.user
    AND u1.user IS NOT NULL
    AND (
        u1.id < u2.id
        OR (u1.id = u2.id AND u1.last_login < u2.last_login)
    )
);

-- Step 5: Add UNIQUE constraint on keycloak_id (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conuser = 'users_keycloak_id_unique'
    ) THEN
        ALTER TABLE "Users"
        ADD CONSTRAINT users_keycloak_id_unique UNIQUE (keycloak_id);
        RAISE NOTICE 'UNIQUE constraint added on keycloak_id';
    ELSE
        RAISE NOTICE 'UNIQUE constraint on keycloak_id already exists';
    END IF;
END $$;

-- Step 6: Add UNIQUE constraint on user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conuser = 'users_user_unique'
    ) THEN
        ALTER TABLE "Users"
        ADD CONSTRAINT users_user_unique UNIQUE (user);
        RAISE NOTICE 'UNIQUE constraint added on user';
    ELSE
        RAISE NOTICE 'UNIQUE constraint on user already exists';
    END IF;
END $$;

-- Step 7: Create index on keycloak_id for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON "Users"(keycloak_id);

-- Step 8: Create index on user for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_user ON "Users"(user);

-- Step 9: Verify constraints were added
SELECT
    conuser AS constraint_user,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = '"Users"'::regclass
AND contype = 'u';  -- 'u' = unique constraints

-- Step 10: Verify indexes were created
SELECT
    schemauser,
    tableuser,
    indexuser,
    indexdef
FROM pg_indexes
WHERE tableuser = 'Users';
