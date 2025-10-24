-- Voice Command Logs Table Migration
-- This table stores all voice command logs synced from the client

CREATE TABLE IF NOT EXISTS perim_voice_command_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('success', 'unhandled', 'error', 'tts_debug', 'stt_used')),

    -- Command data
    transcript TEXT,
    original_transcript TEXT,
    action TEXT,
    original_action TEXT,
    intent TEXT,
    original_intent TEXT,
    parameters JSONB,

    -- Result data
    result TEXT,
    error TEXT,
    reason TEXT,

    -- Conversation data
    conversation_id INTEGER,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    steps JSONB,
    final_result JSONB,

    -- TTS/STT specific data
    provider TEXT,
    status TEXT,
    accurate BOOLEAN,
    confidence NUMERIC,

    -- Additional metadata
    metadata JSONB,

    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE,

    -- Indexes
    CONSTRAINT voice_logs_timestamp_idx CHECK (timestamp IS NOT NULL)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_perim_voice_logs_timestamp ON perim_voice_command_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_perim_voice_logs_type ON perim_voice_command_logs(type);
CREATE INDEX IF NOT EXISTS idx_perim_voice_logs_conversation ON perim_voice_command_logs(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_perim_voice_logs_created_at ON perim_voice_command_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE perim_voice_command_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations on perim_voice_command_logs"
    ON perim_voice_command_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE perim_voice_command_logs IS 'Stores voice command logs from the dashboard for analytics and debugging';
