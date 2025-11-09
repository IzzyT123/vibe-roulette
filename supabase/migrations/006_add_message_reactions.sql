-- Add message reactions for quick emoji communication
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  emoji TEXT NOT NULL CHECK (emoji IN ('🔥', '👍', '😍', '💯', '🎉', '✨', '🚀', '💪')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, message_id, user_id, emoji)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_session ON message_reactions(session_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- Row Level Security
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = message_reactions.session_id
    )
  );

CREATE POLICY "Session participants can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = message_reactions.session_id
      AND session_participants.user_id = message_reactions.user_id
    )
  );

CREATE POLICY "Users can remove their own reactions" ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

