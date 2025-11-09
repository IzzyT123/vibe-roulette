-- Add role column to session_chat to distinguish between user and AI messages
ALTER TABLE session_chat 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('user', 'assistant')) DEFAULT 'user';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_session_chat_role ON session_chat(role);

