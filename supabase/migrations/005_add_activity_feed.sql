-- Add activity feed for tracking session actions
CREATE TABLE IF NOT EXISTS session_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('file_opened', 'file_saved', 'file_created', 'ai_request', 'code_generated', 'error_fixed', 'tab_switched')),
  action_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_session_activity_session ON session_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_session_activity_created ON session_activity(created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE session_activity;

-- Row Level Security
ALTER TABLE session_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view activity" ON session_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_activity.session_id
    )
  );

CREATE POLICY "Session participants can create activity" ON session_activity
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_activity.session_id
      AND session_participants.user_id = session_activity.user_id
    )
  );

