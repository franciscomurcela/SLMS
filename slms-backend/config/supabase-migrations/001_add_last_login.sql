-- Add last_login column to Users table (case-sensitive)
ALTER TABLE public."Users" 
ADD COLUMN IF NOT EXISTS last_login timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc');

-- Create index on keycloak_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON public."Users"(keycloak_id);

-- Comment
COMMENT ON COLUMN public."Users".last_login IS 'Last time the user logged in via Keycloak';
