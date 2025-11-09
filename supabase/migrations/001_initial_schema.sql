-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (anonymous)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('waiting', 'active', 'completed')) DEFAULT 'waiting',
  constraints JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session participants
CREATE TABLE IF NOT EXISTS session_participants (
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('Driver', 'Navigator')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

-- Session files (real-time synced)
CREATE TABLE IF NOT EXISTS session_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(session_id, file_path)
);

-- Session chat
CREATE TABLE IF NOT EXISTS session_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_creator ON sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_files_session ON session_files(session_id);
CREATE INDEX IF NOT EXISTS idx_session_chat_session ON session_chat(session_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_files;
ALTER PUBLICATION supabase_realtime ADD TABLE session_chat;

-- Row Level Security Policies

-- Users: Anyone can read, only authenticated users can insert/update their own
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert themselves" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update themselves" ON users
  FOR UPDATE USING (true);

-- Sessions: Anyone can read active sessions, users can create/update their own
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active sessions are viewable by everyone" ON sessions
  FOR SELECT USING (status = 'active' OR status = 'waiting');

CREATE POLICY "Users can create sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Session participants can update sessions" ON sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = sessions.id
    )
  );

-- Session participants: Viewable by everyone, insertable by anyone
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants are viewable by everyone" ON session_participants
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join sessions" ON session_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can leave sessions" ON session_participants
  FOR DELETE USING (true);

-- Session files: Readable by session participants, writable by participants
ALTER TABLE session_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session files are readable by session participants" ON session_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_files.session_id
    )
  );

CREATE POLICY "Session participants can insert files" ON session_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_files.session_id
    )
  );

CREATE POLICY "Session participants can update files" ON session_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_files.session_id
    )
  );

-- Session chat: Readable/writable by session participants
ALTER TABLE session_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session chat is readable by session participants" ON session_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_chat.session_id
    )
  );

CREATE POLICY "Session participants can send messages" ON session_chat
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_chat.session_id
      AND session_participants.user_id = session_chat.user_id
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

