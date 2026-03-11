-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table (stores file tree)
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  content TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Git branches table
CREATE TABLE IF NOT EXISTS public.git_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Git commits table
CREATE TABLE IF NOT EXISTS public.git_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.git_branches(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  author TEXT NOT NULL,
  hash TEXT NOT NULL,
  parent_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File snapshots for each commit
CREATE TABLE IF NOT EXISTS public.git_file_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_id UUID NOT NULL REFERENCES public.git_commits(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('added', 'modified', 'deleted'))
);

-- Staged files (for git staging area)
CREATE TABLE IF NOT EXISTS public.git_staged_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('added', 'modified', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, file_id)
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_file_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_staged_files ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "projects_select_own" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Files policies (access through project ownership)
CREATE POLICY "files_select_own" ON public.files FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "files_insert_own" ON public.files FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "files_update_own" ON public.files FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "files_delete_own" ON public.files FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid()));

-- Git branches policies
CREATE POLICY "git_branches_select_own" ON public.git_branches FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_branches.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "git_branches_insert_own" ON public.git_branches FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_branches.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "git_branches_update_own" ON public.git_branches FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_branches.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "git_branches_delete_own" ON public.git_branches FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_branches.project_id AND projects.user_id = auth.uid()));

-- Git commits policies
CREATE POLICY "git_commits_select_own" ON public.git_commits FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_commits.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "git_commits_insert_own" ON public.git_commits FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_commits.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "git_commits_delete_own" ON public.git_commits FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_commits.project_id AND projects.user_id = auth.uid()));

-- Git file snapshots policies
CREATE POLICY "git_file_snapshots_select_own" ON public.git_file_snapshots FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.git_commits 
    JOIN public.projects ON projects.id = git_commits.project_id 
    WHERE git_commits.id = git_file_snapshots.commit_id AND projects.user_id = auth.uid()
  ));
CREATE POLICY "git_file_snapshots_insert_own" ON public.git_file_snapshots FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.git_commits 
    JOIN public.projects ON projects.id = git_commits.project_id 
    WHERE git_commits.id = git_file_snapshots.commit_id AND projects.user_id = auth.uid()
  ));

-- Git staged files policies
CREATE POLICY "git_staged_files_select_own" ON public.git_staged_files FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_staged_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "git_staged_files_insert_own" ON public.git_staged_files FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_staged_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "git_staged_files_delete_own" ON public.git_staged_files FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = git_staged_files.project_id AND projects.user_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_project_id ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON public.files(parent_id);
CREATE INDEX IF NOT EXISTS idx_git_commits_project_id ON public.git_commits(project_id);
CREATE INDEX IF NOT EXISTS idx_git_commits_branch_id ON public.git_commits(branch_id);
CREATE INDEX IF NOT EXISTS idx_git_file_snapshots_commit_id ON public.git_file_snapshots(commit_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_files_updated_at ON public.files;
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
