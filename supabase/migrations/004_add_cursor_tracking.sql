-- Add cursor positions tracking for collaborative editing
CREATE TABLE IF NOT EXISTS cursor_positions (
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  column_number INTEGER NOT NULL,
  selection_start_line INTEGER,
  selection_start_column INTEGER,
  selection_end_line INTEGER,
  selection_end_column INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_cursor_positions_session ON cursor_positions(session_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cursor_positions;

-- Row Level Security
ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view cursor positions" ON cursor_positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = cursor_positions.session_id
    )
  );

CREATE POLICY "Session participants can update their cursor position" ON cursor_positions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = cursor_positions.session_id
      AND session_participants.user_id = cursor_positions.user_id
    )
  );

