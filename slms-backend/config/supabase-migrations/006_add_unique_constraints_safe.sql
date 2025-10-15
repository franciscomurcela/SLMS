-- Migration: Add UNIQUE constraints to Users table (Safe version)
-- Date: 2025-10-15
-- Description: Adds UNIQUE constraints without deleting existing data

-- ==========================================
-- STEP 1: Check current state
-- ==========================================

-- Show users that would cause constraint violations

-- Check for duplicate keycloak_ids
SELECT 
    'Duplicate keycloak_ids' as issue_type,
    keycloak_id::text as value,
    COUNT(*) as count,
    string_agg(id::text, ', ') as user_ids
FROM "Users"
WHERE keycloak_id IS NOT NULL
GROUP BY keycloak_id
HAVING COUNT(*) > 1

UNION ALL

-- Check for duplicate names
SELECT 
    'Duplicate names' as issue_type,
    name as value,
    COUNT(*) as count,
    string_agg(id::text, ', ') as user_ids
FROM "Users"
WHERE name IS NOT NULL
GROUP BY name
HAVING COUNT(*) > 1;

-- ==========================================
-- STEP 2: Add UNIQUE constraints (allowing NULL)
-- ==========================================

-- Note: UNIQUE constraints in PostgreSQL allow multiple NULL values
-- This is perfect for our use case where old users might have NULL keycloak_id

-- Add UNIQUE constraint on keycloak_id
DO $$
BEGIN
    -- First, drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = '"Users"'::regclass
        AND conname = 'users_keycloak_id_unique'
    ) THEN
        ALTER TABLE "Users" DROP CONSTRAINT users_keycloak_id_unique;
        RAISE NOTICE '🗑️  Dropped existing constraint on keycloak_id';
    END IF;

    -- Add the constraint
    ALTER TABLE "Users"
    ADD CONSTRAINT users_keycloak_id_unique UNIQUE (keycloak_id);
    RAISE NOTICE '✅ UNIQUE constraint added on keycloak_id (allows NULL)';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE '❌ Cannot add UNIQUE constraint on keycloak_id - duplicates exist';
        RAISE NOTICE 'Please manually resolve duplicate keycloak_ids first';
END $$;

-- Add UNIQUE constraint on name
DO $$
BEGIN
    -- First, drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = '"Users"'::regclass
        AND conname = 'users_name_unique'
    ) THEN
        ALTER TABLE "Users" DROP CONSTRAINT users_name_unique;
        RAISE NOTICE '🗑️  Dropped existing constraint on name';
    END IF;

    -- Add the constraint
    ALTER TABLE "Users"
    ADD CONSTRAINT users_name_unique UNIQUE (name);
    RAISE NOTICE '✅ UNIQUE constraint added on name (allows NULL)';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE '❌ Cannot add UNIQUE constraint on name - duplicates exist';
        RAISE NOTICE 'Please manually resolve duplicate names first';
END $$;

-- ==========================================
-- STEP 3: Create indexes for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON "Users"(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_users_name ON "Users"(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);

-- ==========================================
-- STEP 4: Verify constraints
-- ==========================================

SELECT
    con.conname AS constraint_name,
    CASE con.contype
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
    END AS constraint_type,
    pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
WHERE con.conrelid = '"Users"'::regclass
ORDER BY con.conname;
