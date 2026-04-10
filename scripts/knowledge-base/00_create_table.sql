-- Tabela de base de conhecimento para a IA do Veritas Dei
-- Síntese das 49 fichas de catequese/apologética

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  topic text NOT NULL,
  core_teaching text NOT NULL,
  bible_references text[] DEFAULT '{}',
  summary text NOT NULL,
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_keywords ON ai_knowledge_base USING GIN(keywords);
