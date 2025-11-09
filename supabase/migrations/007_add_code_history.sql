-- Add code history for timeline scrubber
CREATE TABLE IF NOT EXISTS code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  code_snapshot TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  snapshot_type TEXT CHECK (snapshot_type IN ('manual', 'auto', 'milestone')) DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_code_history_session ON code_history(session_id);
CREATE INDEX IF NOT EXISTS idx_code_history_file ON code_history(session_id, file_path);
CREATE INDEX IF NOT EXISTS idx_code_history_created ON code_history(created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE code_history;

-- Row Level Security
ALTER TABLE code_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view code history" ON code_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = code_history.session_id
    )
  );

CREATE POLICY "Session participants can create snapshots" ON code_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = code_history.session_id
      AND session_participants.user_id = code_history.user_id
    )
  );

