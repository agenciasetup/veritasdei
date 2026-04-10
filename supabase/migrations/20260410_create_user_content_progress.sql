-- ═══════════════════════════════════════════════════════
-- user_content_progress — Tracks which subtopics a user has studied
-- Used by: ProgressOverview, StudyStreak, KnowledgeMap, useContentProgress
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_content_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,        -- e.g. 'dogmas', 'sacramentos'
  subtopic_id UUID NOT NULL,         -- FK to content_subtopics.id
  studied_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, content_type, subtopic_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_ucp_user_id ON user_content_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ucp_user_type ON user_content_progress(user_id, content_type);

-- Enable RLS
ALTER TABLE user_content_progress ENABLE ROW LEVEL SECURITY;

-- Users can read/write only their own progress
CREATE POLICY "Users can view own progress"
  ON user_content_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_content_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_content_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_content_progress FOR DELETE
  USING (auth.uid() = user_id);
