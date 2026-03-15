-- Add template column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'web';

-- Add description column for better project management
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add last_opened_at for sorting by recent
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_template ON projects(user_id, template);
CREATE INDEX IF NOT EXISTS idx_projects_last_opened ON projects(user_id, last_opened_at DESC);

-- Update existing projects to have 'web' template
UPDATE projects SET template = 'web' WHERE template IS NULL;
