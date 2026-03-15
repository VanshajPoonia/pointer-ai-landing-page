-- Collaboration Sessions Table
-- Tracks active collaboration sessions for real-time editing

-- Create collaboration_sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_color TEXT DEFAULT '#f59e0b',
  cursor_position JSONB DEFAULT '{"line": 0, "column": 0}'::jsonb,
  selection JSONB,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_collab_sessions_file ON collaboration_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_project ON collaboration_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_active ON collaboration_sessions(is_active);

-- Enable RLS
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see all sessions for projects they have access to
CREATE POLICY "Users can view collaboration sessions for their projects"
  ON collaboration_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = collaboration_sessions.project_id 
      AND projects.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can create their own collaboration sessions"
  ON collaboration_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update their own collaboration sessions"
  ON collaboration_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete their own collaboration sessions"
  ON collaboration_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for collaboration_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;

-- Function to clean up stale sessions (inactive for more than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
  UPDATE collaboration_sessions 
  SET is_active = false 
  WHERE is_active = true 
  AND last_seen_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
