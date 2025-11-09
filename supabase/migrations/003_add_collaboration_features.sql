-- Add typing indicators table for real-time "Vibing..." status
CREATE TABLE IF NOT EXISTS session_typing (
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

-- Add code approvals table for approval workflow
CREATE TABLE IF NOT EXISTS code_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  change_id TEXT NOT NULL, -- Unique ID for this code change
  file_path TEXT NOT NULL,
  code_content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Track approvals from each user
  approvals JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  UNIQUE(session_id, change_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_typing_session ON session_typing(session_id);
CREATE INDEX IF NOT EXISTS idx_code_approvals_session ON code_approvals(session_id);
CREATE INDEX IF NOT EXISTS idx_code_approvals_status ON code_approvals(status);

-- Enable Realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE session_typing;
ALTER PUBLICATION supabase_realtime ADD TABLE code_approvals;

-- Row Level Security for typing indicators
ALTER TABLE session_typing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view typing status" ON session_typing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_typing.session_id
    )
  );

CREATE POLICY "Session participants can update their typing status" ON session_typing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_typing.session_id
      AND session_participants.user_id = session_typing.user_id
    )
  );

-- Row Level Security for code approvals
ALTER TABLE code_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view code approvals" ON code_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = code_approvals.session_id
    )
  );

CREATE POLICY "Session participants can create code approvals" ON code_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = code_approvals.session_id
    )
  );

CREATE POLICY "Session participants can update code approvals" ON code_approvals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = code_approvals.session_id
    )
  );

-- Function to auto-clear typing status after 3 seconds of inactivity
CREATE OR REPLACE FUNCTION clear_stale_typing_status()
RETURNS void AS $$
BEGIN
  UPDATE session_typing
  SET is_typing = false
  WHERE is_typing = true
  AND updated_at < NOW() - INTERVAL '3 seconds';
END;
$$ LANGUAGE plpgsql;

