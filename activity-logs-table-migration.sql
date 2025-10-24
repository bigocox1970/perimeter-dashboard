-- Activity Logs Table Migration
-- This table stores all manual user actions (edits, status changes, etc.)

CREATE TABLE IF NOT EXISTS perim_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Activity details
    action TEXT NOT NULL,
    details TEXT,
    type TEXT NOT NULL DEFAULT 'success' CHECK (type IN ('success', 'warning', 'error')),

    -- User/session info (can be added later if needed)
    user_id TEXT,
    session_id TEXT,

    -- Related entity info (optional - helps link actions to specific records)
    entity_type TEXT, -- e.g., 'customer', 'scaffold', 'maintenance'
    entity_id TEXT,

    -- Changes made (store before/after values as JSON)
    changes JSONB,

    -- Additional metadata
    metadata JSONB,

    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE,

    -- Ensure timestamp is not null
    CONSTRAINT activity_logs_timestamp_idx CHECK (timestamp IS NOT NULL)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_perim_activity_logs_timestamp ON perim_activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_perim_activity_logs_type ON perim_activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_perim_activity_logs_action ON perim_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_perim_activity_logs_entity ON perim_activity_logs(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_perim_activity_logs_created_at ON perim_activity_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE perim_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations on perim_activity_logs"
    ON perim_activity_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE perim_activity_logs IS 'Stores user activity logs for manual actions taken in the dashboard';
