-- ═══════════════════════════════════════════════════════
-- VERBUM FLOWS — Named collections of nodes and edges
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS verbum_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Meu Fluxo',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  node_count INTEGER NOT NULL DEFAULT 0,
  edge_count INTEGER NOT NULL DEFAULT 0,
  clone_count INTEGER NOT NULL DEFAULT 0,
  cloned_from UUID REFERENCES verbum_flows(id) ON DELETE SET NULL,
  thumbnail_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE verbum_nodes ADD COLUMN IF NOT EXISTS flow_id UUID REFERENCES verbum_flows(id) ON DELETE CASCADE;
ALTER TABLE verbum_edges ADD COLUMN IF NOT EXISTS flow_id UUID REFERENCES verbum_flows(id) ON DELETE CASCADE;
ALTER TABLE verbum_user_canvas ADD COLUMN IF NOT EXISTS flow_id UUID REFERENCES verbum_flows(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_verbum_flows_user ON verbum_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_verbum_flows_public ON verbum_flows(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_verbum_nodes_flow ON verbum_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_verbum_edges_flow ON verbum_edges(flow_id);

-- ═══════════════════════════════════════════════════════
-- VERBUM FLOW SHARES
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS verbum_flow_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES verbum_flows(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_user UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verbum_flow_shares_flow ON verbum_flow_shares(flow_id);
CREATE INDEX IF NOT EXISTS idx_verbum_flow_shares_email ON verbum_flow_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_verbum_flow_shares_user ON verbum_flow_shares(shared_with_user);

-- ═══════════════════════════════════════════════════════
-- VERBUM FLOW FAVORITES
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS verbum_flow_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES verbum_flows(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, flow_id)
);

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════

ALTER TABLE verbum_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbum_flow_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbum_flow_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY verbum_flows_select ON verbum_flows FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_public = true
    OR id IN (
      SELECT flow_id FROM verbum_flow_shares
      WHERE (shared_with_user = auth.uid() OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND accepted = true
    )
  );

CREATE POLICY verbum_flows_insert ON verbum_flows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY verbum_flows_update ON verbum_flows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY verbum_flows_delete ON verbum_flows FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY verbum_flow_shares_select ON verbum_flow_shares FOR SELECT
  USING (
    shared_by = auth.uid()
    OR shared_with_user = auth.uid()
    OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY verbum_flow_shares_insert ON verbum_flow_shares FOR INSERT
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY verbum_flow_shares_update ON verbum_flow_shares FOR UPDATE
  USING (
    shared_by = auth.uid()
    OR shared_with_user = auth.uid()
    OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY verbum_flow_shares_delete ON verbum_flow_shares FOR DELETE
  USING (shared_by = auth.uid());

CREATE POLICY verbum_flow_favorites_select ON verbum_flow_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY verbum_flow_favorites_insert ON verbum_flow_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY verbum_flow_favorites_delete ON verbum_flow_favorites FOR DELETE
  USING (auth.uid() = user_id);
