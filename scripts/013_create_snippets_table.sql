-- Create code snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  favorites_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create snippet favorites table (for community marketplace)
CREATE TABLE IF NOT EXISTS snippet_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snippet_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_is_public ON snippets(is_public);
CREATE INDEX IF NOT EXISTS idx_snippets_tags ON snippets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_snippet_favorites_user ON snippet_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_snippet_favorites_snippet ON snippet_favorites(snippet_id);

-- Enable RLS
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for snippets
DROP POLICY IF EXISTS "Users can view own snippets" ON snippets;
CREATE POLICY "Users can view own snippets" ON snippets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public snippets" ON snippets;
CREATE POLICY "Users can view public snippets" ON snippets
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert own snippets" ON snippets;
CREATE POLICY "Users can insert own snippets" ON snippets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own snippets" ON snippets;
CREATE POLICY "Users can update own snippets" ON snippets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own snippets" ON snippets;
CREATE POLICY "Users can delete own snippets" ON snippets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for snippet_favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON snippet_favorites;
CREATE POLICY "Users can view own favorites" ON snippet_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON snippet_favorites;
CREATE POLICY "Users can insert own favorites" ON snippet_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON snippet_favorites;
CREATE POLICY "Users can delete own favorites" ON snippet_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update favorites count
CREATE OR REPLACE FUNCTION update_snippet_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE snippets SET favorites_count = favorites_count + 1 WHERE id = NEW.snippet_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE snippets SET favorites_count = favorites_count - 1 WHERE id = OLD.snippet_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for favorites count
DROP TRIGGER IF EXISTS on_snippet_favorite_change ON snippet_favorites;
CREATE TRIGGER on_snippet_favorite_change
AFTER INSERT OR DELETE ON snippet_favorites
FOR EACH ROW EXECUTE FUNCTION update_snippet_favorites_count();
