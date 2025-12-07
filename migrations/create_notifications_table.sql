-- Create Notifications table
CREATE TABLE IF NOT EXISTS "Notifications" (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id uuid,
    severity VARCHAR(20) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "Notifications"(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON "Notifications"(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "Notifications"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON "Notifications"(user_id, is_read) WHERE is_read = FALSE;

-- Display confirmation
SELECT 'Notifications table created successfully' as status;
