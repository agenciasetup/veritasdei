-- Expand ai_knowledge_base for admin management system
-- Adds structured fields for catechism, patristics, theology, tradition
-- Plus workflow fields (status, audit, raw input storage)

ALTER TABLE ai_knowledge_base
  ADD COLUMN IF NOT EXISTS catechism_references text DEFAULT '',
  ADD COLUMN IF NOT EXISTS patristic_references text DEFAULT '',
  ADD COLUMN IF NOT EXISTS theology_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tradition_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_input jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_knowledge_base_status_check'
  ) THEN
    ALTER TABLE ai_knowledge_base
      ADD CONSTRAINT ai_knowledge_base_status_check
      CHECK (status IN ('active', 'draft', 'archived'));
  END IF;
END $$;

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_ai_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_knowledge_base_updated_at ON ai_knowledge_base;
CREATE TRIGGER trg_ai_knowledge_base_updated_at
  BEFORE UPDATE ON ai_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_ai_kb_updated_at();
