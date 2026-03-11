-- GitHub connections table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_id BIGINT NOT NULL,
  github_username TEXT NOT NULL,
  github_avatar TEXT,
  access_token TEXT NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "github_connections_select_own" ON github_connections 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "github_connections_insert_own" ON github_connections 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "github_connections_update_own" ON github_connections 
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "github_connections_delete_own" ON github_connections 
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_github_connections_user_id ON github_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_github_connections_github_id ON github_connections(github_id);

-- Add version_control_provider to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS version_control_provider TEXT DEFAULT 'local' CHECK (version_control_provider IN ('local', 'github'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_owner TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_default_branch TEXT DEFAULT 'main';
