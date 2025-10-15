-- Migration: Add UNIQUE constraints to Users table to prevent duplicates
-- Date: 2025-10-15
-- Description: Ensures no duplicate users can be created by adding UNIQUE constraints

-- ==========================================
-- STEP 1: Check for existing duplicates
-- ==========================================

-- Check for duplicate keycloak_ids
SELECT keycloak_id, COUNT(*) as count
FROM "Users"
WHERE keycloak_id IS NOT NULL
GROUP BY keycloak_id
HAVING COUNT(*) > 1;

-- Check for duplicate names
SELECT name, COUNT(*) as count
FROM "Users"
WHERE name IS NOT NULL
GROUP BY name
HAVING COUNT(*) > 1;

-- ==========================================
-- STEP 2: Clean up duplicates
-- ==========================================

-- Delete duplicate users by keycloak_id (keep most recent by last_login)
DELETE FROM "Users" u1
WHERE EXISTS (
    SELECT 1 FROM "Users" u2
    WHERE u1.keycloak_id = u2.keycloak_id
    AND u1.keycloak_id IS NOT NULL
    AND u1.last_login < u2.last_login
);

-- Delete duplicate users by name (keep most recent by last_login)
-- Only if they don't have keycloak_id set
DELETE FROM "Users" u1
WHERE EXISTS (
    SELECT 1 FROM "Users" u2
    WHERE u1.name = u2.name
    AND u1.name IS NOT NULL
    AND u1.id != u2.id
    AND u1.keycloak_id IS NULL
    AND (u1.last_login < u2.last_login OR (u1.last_login = u2.last_login AND u1.id < u2.id))
);

-- ==========================================
-- STEP 3: Add UNIQUE constraints
-- ==========================================

-- Add UNIQUE constraint on keycloak_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = '"Users"'::regclass
        AND conname = 'users_keycloak_id_unique'
    ) THEN
        ALTER TABLE "Users"
        ADD CONSTRAINT users_keycloak_id_unique UNIQUE (keycloak_id);
        RAISE NOTICE '✅ UNIQUE constraint added on keycloak_id';
    ELSE
        RAISE NOTICE 'ℹ️  UNIQUE constraint on keycloak_id already exists';
    END IF;
END $$;

-- Add UNIQUE constraint on name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = '"Users"'::regclass
        AND conname = 'users_name_unique'
    ) THEN
        ALTER TABLE "Users"
        ADD CONSTRAINT users_name_unique UNIQUE (name);
        RAISE NOTICE '✅ UNIQUE constraint added on name';
    ELSE
        RAISE NOTICE 'ℹ️  UNIQUE constraint on name already exists';
    END IF;
END $$;

-- ==========================================
-- STEP 4: Create indexes for performance
-- ==========================================

-- Create index on keycloak_id for better query performance
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON "Users"(keycloak_id);

-- Create index on name for better query performance
CREATE INDEX IF NOT EXISTS idx_users_name ON "Users"(name);

-- Create index on email for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);

-- ==========================================
-- STEP 5: Verify constraints and indexes
-- ==========================================

-- Show all constraints on Users table
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
    END AS constraint_description,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
WHERE con.conrelid = '"Users"'::regclass
ORDER BY con.conname;

-- Show all indexes on Users table
SELECT
    i.relname AS index_name,
    a.attname AS column_name,
    am.amname AS index_type
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
JOIN pg_am am ON am.oid = i.relam
WHERE t.relname = 'Users'
ORDER BY i.relname, a.attname;

-- ==========================================
-- FINAL CHECK: Verify no duplicates remain
-- ==========================================

SELECT 
    'Users table state' as info,
    COUNT(*) as total_users,
    COUNT(DISTINCT keycloak_id) as unique_keycloak_ids,
    COUNT(DISTINCT name) as unique_names
FROM "Users";
