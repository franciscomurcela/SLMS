-- Migration: Add first_name and last_name columns to Users table
-- Date: 2025-10-14
-- Description: Adds columns to store user's first and last names from Keycloak

-- Add first_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN first_name VARCHAR(100);
        RAISE NOTICE 'Added first_name column';
    ELSE
        RAISE NOTICE 'first_name column already exists';
    END IF;
END $$;

-- Add last_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN last_name VARCHAR(100);
        RAISE NOTICE 'Added last_name column';
    ELSE
        RAISE NOTICE 'last_name column already exists';
    END IF;
END $$;

-- Create index on first_name for better search performance
CREATE INDEX IF NOT EXISTS idx_users_first_name ON "Users"(first_name);

-- Create index on last_name for better search performance
CREATE INDEX IF NOT EXISTS idx_users_last_name ON "Users"(last_name);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'Users' 
  AND column_name IN ('first_name', 'last_name')
ORDER BY column_name;
